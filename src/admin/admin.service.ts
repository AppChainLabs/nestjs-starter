import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';

import {
  AuthDocument,
  AuthModel,
  AuthType,
  HashingAlgorithm,
  PasswordCredential,
  WalletCredential,
} from '../auth/entities/auth.entity';
import {
  AuthSessionDocument,
  AuthSessionModel,
} from '../auth/entities/auth-session.entity';
import {
  AuthChallengeDocument,
  AuthChallengeModel,
} from '../auth/entities/auth-challenge.entity';
import { UpdateUserDto } from '../user/dto/update-user.dto';
import { UserDocument, UserModel } from '../user/entities/user.entity';
import {
  AdminCreateAuthEntityDto,
  AdminPasswordCredentialDto,
  AdminWalletCredentialDto,
} from './dto/create-auth-entity.dto';
import { UserService } from '../user/user.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AdminService {
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

    // inject model
    @InjectModel(UserModel.name)
    private UserDocument: Model<UserDocument>,

    private userService: UserService,

    private authService: AuthService,
  ) {}

  async validateUserExistence(userId: string) {
    if (await this.UserDocument.findById(userId)) {
      throw new NotFoundException('ADMIN::USER::USER_NOT_EXISTED');
    }
  }

  async validateUserHasValidUsername(userId: string) {
    await this.validateUserExistence(userId);

    const user = await this.UserDocument.findById(userId);

    if (!user.username && !user.email) {
      throw new ConflictException('ADMIN::USER::USER_INVALID_USERNAME');
    }
  }

  async validateWalletCredential(
    userId: string,
    adminCreateAuthEntityDto: AdminCreateAuthEntityDto,
  ) {
    await this.validateUserExistence(userId);

    const credential =
      adminCreateAuthEntityDto.credential as AdminWalletCredentialDto;

    await this.userService.validateWallet(credential.walletAddress);
  }

  async validatePasswordCredential(
    userId: string,
    adminCreateAuthEntityDto: AdminCreateAuthEntityDto,
  ) {
    await this.validateUserHasValidUsername(userId);

    const credential =
      adminCreateAuthEntityDto.credential as AdminPasswordCredentialDto;

    if (!credential.password)
      throw new BadRequestException('ADMIN::USER::CREDENTIAL_NOT_PROVIDED');
  }

  async adminSetPrimaryAuthEntity(userId: string, authId: string) {
    return this.userService.setPrimaryAuthEntity(userId, authId);
  }

  async adminCreateAuthEntity(
    userId: string,
    adminCreateAuthEntityDto: AdminCreateAuthEntityDto,
  ) {
    let credential: PasswordCredential | WalletCredential;

    switch (adminCreateAuthEntityDto.type) {
      case AuthType.Password:
        await this.validatePasswordCredential(userId, adminCreateAuthEntityDto);

        const rawPasswordCredential =
          adminCreateAuthEntityDto.credential as AdminPasswordCredentialDto;

        credential = {
          password: await this.authService.hashPassword(
            rawPasswordCredential.password,
          ),
          algorithm: HashingAlgorithm.BCrypt,
        } as PasswordCredential;
        break;

      default:
        await this.validateWalletCredential(userId, adminCreateAuthEntityDto);

        const rawWalletCredential =
          adminCreateAuthEntityDto.credential as AdminWalletCredentialDto;

        credential = {
          walletAddress: rawWalletCredential.walletAddress,
        } as WalletCredential;

        break;
    }

    const isPrimary = !!!(await this.AuthDocument.findOne({
      userId,
      isPrimary: true,
    }));

    const auth = new this.AuthDocument({
      userId,
      type: adminCreateAuthEntityDto.type,
      credential,
      isPrimary,
    });

    return auth.save();
  }

  adminFindAllUsers(
    searchQuery: string,
    limit: number,
    skip: number,
    sort: string,
  ) {
    const reg = new RegExp(searchQuery, 'i');
    return this.UserDocument.find(
      {
        $or: [
          { email: { $regex: reg } },
          { username: { $regex: reg } },
          { displayName: { $regex: reg } },
        ],
      },
      {},
      { skip, limit, sort },
    );
  }

  async adminFindUserById(id: string) {
    return this.UserDocument.findById(id);
  }

  async adminUpdateUserById(id: string, updateUserDto: UpdateUserDto) {
    await this.UserDocument.updateOne({ _id: id }, { $set: updateUserDto });
    return this.adminFindUserById(id);
  }

  async adminRemoveUserById(userId: string) {
    console.log({ userId });
    const session = await this.connection.startSession();

    await session.withTransaction(async () => {
      // clean up all relation objects
      await this.AuthSessionDocument.deleteMany({
        userId,
      });

      await this.AuthDocument.deleteMany({
        userId,
      });

      await this.UserDocument.deleteOne({ _id: userId });
    });

    await session.endSession();
  }

  async adminGetUserAuthEntities(userId: string) {
    return this.AuthDocument.find({ userId });
  }

  async adminDeleteUserAuthEntity(userId: string, id: string) {
    if (await this.AuthDocument.findOne({ userId, _id: id, isPrimary: true })) {
      throw new UnprocessableEntityException(
        'ADMIN::AUTH_ENTITY::CANNOT_DELETE_PRIMARY_ENTITY_CONSTRAINT',
      );
    }

    const session = await this.connection.startSession();

    await session.withTransaction(async () => {
      await this.AuthDocument.deleteOne({
        userId,
        _id: id,
      });

      await this.AuthSessionDocument.deleteMany({
        authId: id,
      });
    });

    await session.endSession();
  }
}
