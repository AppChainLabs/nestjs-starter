import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';

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
import { UserDocument, UserRole } from '../user/entities/user.entity';
import { HashingService } from '../providers/hashing';
import { SignatureService } from '../providers/signature';
import { WalletCredentialAuthDto } from './dto/wallet-credential-auth.dto';
import { PasswordCredentialAuthDto } from './dto/password-credential-auth.dto';
import { Jwt } from '../providers/jwt';
import { JwtPayload, JwtSignedData } from './dto/jwt-auth.dto';
import {
  AuthSessionDocument,
  AuthSessionModel,
  GrantType,
  SessionType,
} from './entities/auth-session.entity';
import {
  AuthChallengeDocument,
  AuthChallengeModel,
} from './entities/auth-challenge.entity';

@Injectable()
export class AuthService {
  constructor(
    // inject connection
    @InjectConnection() private readonly connection: mongoose.Connection,

    // inject model
    @InjectModel(AuthModel.name)
    private AuthDocument: Model<AuthDocument>,

    // inject model
    @InjectModel(AuthSessionModel.name)
    private AuthSessionDocument: Model<AuthSessionDocument>,

    // inject model
    @InjectModel(AuthChallengeModel.name)
    private AuthChallengeDocument: Model<AuthChallengeDocument>,

    // inject service
    private userService: UserService,

    // inject hashing service
    private hashingService: HashingService,

    // inject jwt service
    private jwtService: JwtService,

    // inject jwt options
    private jwtOptions: Jwt,
  ) {}

  private async generateChecksum(data: any) {
    return this.hashingService
      .getHasher(HashingAlgorithm.BCrypt)
      .hash(JSON.stringify(data));
  }

  async generateAuthChallenge(target: string) {
    const checksum = await this.generateChecksum(target);

    const currentDateTime = new Date();
    const expiredDate = currentDateTime.setTime(
      currentDateTime.getTime() + 60 * 1000,
    );

    const message = `Sign in with ${target}.\nChallenge hash: ${checksum}.\nDate: ${currentDateTime.toISOString()}.`;

    const authChallenge = new this.AuthChallengeDocument({
      walletAddress: target,
      expiredDate: expiredDate,
      message: message,
    });

    return authChallenge.save();
  }

  async generateAccessToken(
    audience: string,
    { authEntity, user }: { authEntity: AuthDocument; user: UserDocument },
    sessionType = SessionType.Auth,
  ) {
    const payload = {
      signedData: {
        uid: user.id,
        em: user.email,
        un: user.username,
        scope: user.roles,
        verified: user.isEmailVerified,
        enabled: user.isEnabled,
        sessionType,
      },
    } as JwtSignedData;

    const checksum = await this.generateChecksum(payload);

    const sessionObj = new this.AuthSessionDocument({
      authId: authEntity.id,
      authorizerId: user.id,
      userId: user.id,
      grantType: GrantType.Self,
      checksum,
      sessionType,
      expiresIn: this.jwtOptions.getSignInOptions().expiresIn,
    });

    const session = await sessionObj.save();

    const tokenIdentity = {
      typ: 'Bearer',
      azp: authEntity.id,
      acr: '1',
      sid: session.id,
    };

    return {
      accessToken: this.jwtService.sign(
        { ...payload, ...tokenIdentity } as JwtPayload,
        {
          ...this.jwtOptions.getSignInOptions(audience),
          subject: session.checksum,
          jwtid: session.id,
        },
      ),
    };
  }

  getAuthEntities(userId: string) {
    return this.AuthDocument.find({ userId });
  }

  findAuthEntityWithUserId(
    authType: AuthType,
    userId: string,
    walletAddress = undefined,
  ) {
    return this.AuthDocument.findOne({
      type: authType,
      userId,
      'credential.walletAddress':
        authType === AuthType.Password ? undefined : walletAddress,
    });
  }

  // weird bug from Jetbrains
  findAuthSessionById(authSessionId: string): any {
    return this.AuthSessionDocument.findById(authSessionId);
  }

  findAuthChallengeById(id: string) {
    return this.AuthChallengeDocument.findById(id);
  }

  async verifyWalletSignature(
    authType: AuthType,
    walletCredentialDto: WalletCredentialAuthDto,
    walletCredential: WalletCredential,
  ) {
    // Check for valid auth challenge
    const authChallenge = await this.findAuthChallengeById(
      walletCredentialDto.authChallengeId,
    );

    if (!authChallenge) {
      return false;
    }

    if (authChallenge.isResolved) {
      return false;
    }

    if (new Date().getTime() > new Date(authChallenge.expiredDate).getTime()) {
      return false;
    }

    if (walletCredentialDto.walletAddress !== authChallenge.walletAddress) {
      return false;
    }

    if (walletCredentialDto.walletAddress !== walletCredential.walletAddress) {
      return false;
    }

    const signer = new SignatureService().getSigner(authType);
    const isVerified = signer.verify(
      authChallenge.message,
      walletCredentialDto.signedData,
      walletCredential.walletAddress,
    );

    if (isVerified) {
      // now to mark the challenge resolved
      authChallenge.isResolved = true;
      await authChallenge.save();
    }

    return isVerified;
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

      const isCredentialVerified = await this.verifyWalletSignature(
        createAuthDto.type,
        credentialDto,
        {
          walletAddress: credentialDto.walletAddress,
        },
      );

      if (!isCredentialVerified) {
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
