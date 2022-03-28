import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';

import { CreateAuthDto } from './dto/create-auth.dto';
import { UserService } from '../user/user.service';
import { RegistrationAuthDto } from './dto/registration-auth.dto';
import { AuthDocument, AuthModel, AuthType } from './entities/auth.entity';

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
  ) {}

  getAuthEntities(userId: string) {
    return this.AuthDocument.find({ userId });
  }

  async signUpUser(registrationDto: RegistrationAuthDto) {
    if (registrationDto.type === AuthType.Password && !registrationDto.email) {
      throw new BadRequestException(`${AuthType.Password}::EMAIL_NOT_PROVIDED`);
    }

    const session = await this.connection.startSession();
    await session.startTransaction();

    const user = await this.userService.create(registrationDto);
    await this.createAuthEntity(registrationDto);

    session.endSession();
    return user;
  }

  async createAuthEntity(createAuthDto: CreateAuthDto) {
    if (
      createAuthDto.type === AuthType.Password &&
      (await this.AuthDocument.findOne({ type: createAuthDto.type }))
    ) {
      throw new ConflictException(`${AuthType.Password}::DUPLICATED_ENTITIES`);
    }

    const authDocument = new this.AuthDocument({
      userId: createAuthDto.userId,
      credentials: createAuthDto.credentials,
      type: createAuthDto.type,
    });

    return authDocument.save();
  }

  deleteAuthEntity(id: string) {
    return this.AuthDocument.findByIdAndRemove(id);
  }
}
