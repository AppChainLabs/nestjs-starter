import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';

import {
  AuthModel,
  AuthDocument,
  AuthType,
} from '../auth/entities/auth.entity';
import {
  AuthSessionModel,
  AuthSessionDocument,
} from '../auth/entities/auth-session.entity';
import {
  AuthChallengeModel,
  AuthChallengeDocument,
} from '../auth/entities/auth-challenge.entity';
import { UpdateUserDto } from '../user/dto/update-user.dto';
import { UserModel, UserDocument } from '../user/entities/user.entity';
import {
  AdminCreateAuthEntityDto,
  AdminWalletCredentialDto,
} from './dto/create-auth-entity.dto';
import { UserService } from '../user/user.service';

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
  ) {}

  async validateUserExistence(userId: string) {
    if (await this.UserDocument.findById(userId)) {
      throw new NotFoundException('ADMIN::AUTH::USER_NOT_EXISTED');
    }
  }

  async validateUserHasValidUsername(userId: string) {
    await this.validateUserExistence(userId);

    const user = await this.UserDocument.findById(userId);

    if (!user.username && !user.email) {
      throw new ConflictException('ADMIN::AUTH::USER_INVALID_USERNAME');
    }
  }

  async validateWalletCredential(
    adminCreateAuthEntityDto: AdminCreateAuthEntityDto,
  ) {
    await this.validateUserExistence(adminCreateAuthEntityDto.userId);

    const credential =
      adminCreateAuthEntityDto.credential as AdminWalletCredentialDto;

    if (
      await this.AuthDocument.findOne({
        'credential.walletAddress': credential.walletAddress,
      })
    ) {
      throw new ConflictException('ADMIN::AUTH::DUPLICATED_WALLET_ADDRESS');
    }
  }

  async validatePasswordCredential(
    adminCreateAuthEntityDto: AdminCreateAuthEntityDto,
  ) {
    await this.validateUserHasValidUsername(adminCreateAuthEntityDto.userId);
  }

  async adminSetPrimaryAuthEntity(userId: string, authId: string) {
    return this.userService.setPrimaryAuthEntity(userId, authId);
  }

  async adminCreateAuthEntity(
    adminCreateAuthEntityDto: AdminCreateAuthEntityDto,
  ) {
    switch (adminCreateAuthEntityDto.type) {
      case AuthType.Password:
        await this.validatePasswordCredential(adminCreateAuthEntityDto);
        break;

      default:
        await this.validateWalletCredential(adminCreateAuthEntityDto);
        break;
    }

    const auth = new this.AuthDocument({
      userId: adminCreateAuthEntityDto.userId,
      type: adminCreateAuthEntityDto.type,
      credential: adminCreateAuthEntityDto.credential,
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
    await this.UserDocument.updateOne({ id }, { $set: updateUserDto });
    return this.adminFindUserById(id);
  }

  async adminRemoveUserById(userId: string) {
    const session = await this.connection.startSession();

    await session.withTransaction(async () => {
      // clean up all relation objects
      await this.AuthSessionDocument.remove({
        userId,
      });

      await this.AuthDocument.remove({
        userId,
      });

      await this.UserDocument.findByIdAndRemove(userId);
    });

    await session.endSession();
  }

  async adminGetUserAuthEntities(userId: string) {
    return this.AuthDocument.find({ userId });
  }

  async adminDeleteUserAuthEntity(userId: string, id: string) {
    if (await this.AuthDocument.findOne({ userId, _id: id, isPrimary: true })) {
      throw new UnprocessableEntityException(
        'AUTH::DELETE::CANNOT_DELETE_PRIMARY_ENTITY_CONSTRAINT',
      );
    }

    return this.AuthDocument.findOneAndRemove({
      userId,
      _id: id,
    });
  }
}
