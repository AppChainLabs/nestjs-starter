import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UserDocument, UserModel } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserModel.name)
    private UserDocument: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user = new this.UserDocument(createUserDto);
    return user.save();
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
    return this.UserDocument.findOne({ id });
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
