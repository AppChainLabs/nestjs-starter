import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';

import { CreateUserDto } from './dto/create-user.dto';
import { AuthModel, AuthDocument } from '../auth/entities/auth.entity';
import { UserDocument, UserModel } from './entities/user.entity';
import { UpdateProfileAuthDto } from './dto/profile-user.dto';
import { StorageService } from '../providers/file';
import {
  AuthSessionDocument,
  AuthSessionModel,
} from '../auth/entities/auth-session.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserModel.name)
    private UserDocument: Model<UserDocument>,

    // inject connection
    @InjectConnection() private readonly connection: mongoose.Connection,

    // inject model
    @InjectModel(AuthModel.name)
    private AuthDocument: Model<AuthDocument>,

    // inject model
    @InjectModel(AuthSessionModel.name)
    private AuthSessionDocument: Model<AuthSessionDocument>,

    private storageService: StorageService,
  ) {}

  async uploadFile(userId: string, file: any) {
    const { originalname, buffer } = file;
    const fileName = `${new Date().getTime()}.${originalname}`;
    const { url } = await this.storageService.putStream(fileName, buffer);

    await this.UserDocument.updateOne(
      { _id: userId },
      { $set: { avatar: url } },
    );
  }

  async setPrimaryAuthEntity(userId: string, authId: string) {
    if (!(await this.AuthDocument.findOne({ userId, _id: authId }))) {
      throw new ForbiddenException();
    }

    await this.AuthDocument.updateOne(
      { userId, isPrimary: true },
      { $set: { isPrimary: false } },
    );

    await this.AuthDocument.updateOne(
      { userId, _id: authId },
      { $set: { isPrimary: true } },
    );

    return this.AuthDocument.findById(authId);
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileAuthDto) {
    const removeEmail = updateProfileDto.removeEmail;
    delete updateProfileDto.removeEmail;

    await this.UserDocument.findByIdAndUpdate(userId, {
      $set: updateProfileDto,
      $unset: removeEmail ? { email: 1 } : undefined,
    });

    return this.UserDocument.findById(userId);
  }

  async getUserAuthEntities(userId: string) {
    return this.AuthDocument.find({ userId }, {}, { sort: 'createdAt' });
  }

  async deleteUserAuthEntity(userId: string, id: string) {
    if (await this.AuthDocument.findOne({ userId, _id: id, isPrimary: true })) {
      throw new UnprocessableEntityException(
        'USER::AUTH_ENTITY::CANNOT_DELETE_PRIMARY_ENTITY_CONSTRAINT',
      );
    }

    const session = await this.connection.startSession();

    await session.withTransaction(async () => {
      await this.AuthDocument.findOneAndRemove({
        userId,
        _id: id,
      });

      await this.AuthSessionDocument.remove({
        authId: id,
      });
    });

    await session.endSession();
  }

  async validateEmailOrUsername(query: string) {
    const existedUser = await this.findByEmailOrUsername(query);

    if (existedUser) {
      throw new ConflictException('USER::AUTH_ENTITY::USER_EXISTED');
    }
  }

  async validateWallet(walletAddress: string) {
    const existedAuth = this.AuthDocument.findOne({
      'credential.walletAddress': walletAddress,
    });

    if (existedAuth) {
      throw new ConflictException('USER::AUTH_ENTITY::WALLET_EXISTED');
    }
  }

  async create(createUserDto: CreateUserDto) {
    if (createUserDto.email)
      await this.validateEmailOrUsername(createUserDto.email);

    if (createUserDto.username)
      await this.validateEmailOrUsername(createUserDto.username);

    const user = new this.UserDocument(createUserDto);
    return user.save();
  }

  async findByEmailOrUsername(query: string) {
    return this.UserDocument.findOne({
      $or: [{ email: query }, { username: query }],
    });
  }

  async findByEmail(email: string) {
    return this.UserDocument.findOne({
      $or: [{ email }],
    });
  }

  async findById(id: string) {
    return this.UserDocument.findById(id);
  }
}
