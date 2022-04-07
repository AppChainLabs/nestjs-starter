import { ForbiddenException, Injectable } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthModel, AuthDocument } from '../auth/entities/auth.entity';
import { UserDocument, UserModel } from './entities/user.entity';

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

  getUserAuthEntities(userId: string) {
    return this.AuthDocument.find({ userId });
  }

  async deleteUserAuthEntity(userId: string, id: string) {
    if ((await this.AuthDocument.count({ userId })) === 1) {
      throw new ForbiddenException(
        'AUTH::DELETE::AT_LEAST_ONE_ENTITY_CONSTRAINT',
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

  findByEmailOrUsername(query: string) {
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

  findById(id: string) {
    return this.UserDocument.findById(id);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const payload = { ...updateUserDto, updatedAt: new Date().getTime() };
    await this.UserDocument.updateOne({ id }, { $set: payload });

    return this.findById(id);
  }

  remove(id: string) {
    return this.UserDocument.findByIdAndRemove(id);
  }
}
