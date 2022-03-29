import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';

import { CreateAuthDto } from './dto/create-auth.dto';
import { UserService } from '../user/user.service';
import { RegistrationAuthDto } from './dto/registration-auth.dto';
import {
  AuthDocument,
  AuthModel,
  AuthType,
  HashingAlgorithm,
  PasswordCredential,
  WalletCredential,
} from './entities/auth.entity';
import { UserRole } from '../user/entities/user.entity';
import { HashingService } from '../providers/hashing';
import { SignatureService } from '../providers/signature';
import { WalletCredentialAuthDto } from './dto/wallet-credential-auth.dto';
import { PasswordCredentialAuthDto } from './dto/password-credential-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    // inject connection
    @InjectConnection() private readonly connection: mongoose.Connection,

    // inject model
    @InjectModel(AuthModel.name)
    private AuthDocument: Model<AuthDocument>,

    // inject service
    private userService: UserService,

    // inject hashing service
    private hashingService: HashingService,
  ) {}

  getAuthEntities(userId: string) {
    return this.AuthDocument.find({ userId });
  }

  verifyWalletSignature(
    authType: AuthType,
    walletCredentialDto: WalletCredentialAuthDto,
    walletCredential: WalletCredential,
  ) {
    const signer = new SignatureService().getSigner(authType);
    return signer.verify(walletCredentialDto, walletCredential);
  }

  async validateUserWithWalletCredential(
    query: string,
    authType: AuthType,
    walletCredentialDto: WalletCredentialAuthDto,
  ) {
    const user = await this.userService.findByEmailOrUsername(query);
    if (!user) throw new UnauthorizedException();

    const { credentials }: { credentials: WalletCredential } =
      await this.AuthDocument.findOne({
        userId: user.id,
        type: authType,
      });

    if (!this.verifyWalletSignature(authType, walletCredentialDto, credentials))
      throw new UnauthorizedException();
    return user;
  }

  async validateUserWithPasswordCredential(query: string, password: string) {
    const user = await this.userService.findByEmailOrUsername(query);
    if (!user) throw new UnauthorizedException();

    const { credentials }: { credentials: PasswordCredential } =
      await this.AuthDocument.findOne({
        userId: user.id,
        type: AuthType.Password,
      });

    if (credentials.algorithm !== HashingAlgorithm.BCrypt)
      throw new UnauthorizedException();

    const hasher = this.hashingService.getHasher(credentials.algorithm);

    const isHashValid = await hasher.compare(password, credentials.password);
    if (!isHashValid) throw new UnauthorizedException();

    return user;
  }

  async signUpUser(registrationDto: RegistrationAuthDto) {
    let user;

    const session = await this.connection.startSession();
    await session.withTransaction(async () => {
      // create user first
      user = await this.userService.create({
        username: registrationDto.username,
        email: registrationDto.email,
        displayName: registrationDto.displayName,
        avatar: registrationDto.avatar,
        isEnabled: true,
        isEmailVerified: false,
        roles: [UserRole.User],
      });

      // then create auth entity
      await this.createAuthEntity({
        type: registrationDto.type,
        credential: registrationDto.credential,
        userId: user.id,
      });
    });

    await session.endSession();
    return user;
  }

  async createAuthEntity(createAuthDto: CreateAuthDto) {
    let credentialData;

    if (createAuthDto.type === AuthType.Password) {
      const credentialDto =
        createAuthDto.credential as PasswordCredentialAuthDto;

      if (!credentialDto.password) {
        throw new BadRequestException('AUTH::CREATE::CREDENTIAL_NOT_PROVIDED');
      }

      if (
        await this.AuthDocument.findOne({
          userId: createAuthDto.userId,
          type: createAuthDto.type,
        })
      )
        throw new ConflictException(`AUTH::CREATE::DUPLICATED_ENTITIES`);

      credentialData = {
        password: await this.hashingService
          .getHasher(HashingAlgorithm.BCrypt)
          .hash(credentialDto.password),

        algorithm: HashingAlgorithm.BCrypt,
      } as PasswordCredential;
    } else {
      const credentialDto = createAuthDto.credential as WalletCredentialAuthDto;

      if (
        !this.verifyWalletSignature(createAuthDto.type, credentialDto, {
          walletAddress: credentialDto.walletAddress,
        })
      ) {
        throw new BadRequestException('AUTH::CREATE::SIGNATURE_NOT_MATCHED');
      }

      credentialData = {
        walletAddress: credentialDto.walletAddress,
      };
    }

    const authDocument = new this.AuthDocument({
      userId: createAuthDto.userId,
      credential: credentialData,
      type: createAuthDto.type,
    });

    return authDocument.save();
  }

  async deleteAuthEntity(id: string) {
    const entity = await this.AuthDocument.findById(id);

    if ((await this.AuthDocument.count({ userId: entity.userId })) === 1) {
      throw new ForbiddenException(
        'AUTH::DELETE::AT_LEAST_ONE_ENTITY_CONSTRAINT',
      );
    }

    return this.AuthDocument.findByIdAndRemove(id);
  }
}
