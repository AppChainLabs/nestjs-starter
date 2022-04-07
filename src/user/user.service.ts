import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  AuthModel,
  AuthDocument,
  AuthType,
} from '../auth/entities/auth.entity';
import { UserDocument, UserModel } from './entities/user.entity';
import { UpdateProfileAuthDto } from './dto/profile-auth.dto';

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
  ) {}

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
    return this.AuthDocument.find({ userId });
  }

  async deleteUserAuthEntity(userId: string, id: string) {
    if ((await this.AuthDocument.count({ userId })) === 1) {
      throw new UnprocessableEntityException(
        'AUTH::DELETE::AT_LEAST_ONE_ENTITY_CONSTRAINT',
      );
    }

    if (
      (await this.AuthDocument.count({
        _id: id,
        userId,
        type: AuthType.Password,
      })) === 1
    ) {
      throw new UnprocessableEntityException(
        'AUTH::DELETE::CANNOT_DELETE_PASSWORD_ENTITY_CONSTRAINT',
      );
    }

    return this.AuthDocument.findOneAndRemove({
      userId,
      _id: id,
    });
  }

  async create(createUserDto: CreateUserDto) {
    const user = new this.UserDocument(createUserDto);
    return user.save();
  }

  async findByEmailOrUsername(query: string) {
    return this.UserDocument.findOne({
      $or: [{ email: query }, { username: query }],
    });
  }

  findAll(searchQuery: string, limit: number, skip: number, sort: string) {
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

  async findById(id: string) {
    return this.UserDocument.findById(id);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.UserDocument.updateOne({ id }, { $set: updateUserDto });
    return this.findById(id);
  }

  async remove(id: string) {
    return this.UserDocument.findByIdAndRemove(id);
  }
}
