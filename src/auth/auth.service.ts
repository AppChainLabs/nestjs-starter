import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';

import { CreateAuthDto } from './dto/create-auth.dto';
import { UserService } from '../user/user.service';
import { RegistrationAuthDto } from './dto/registration-auth.dto';
import { AuthDocument, AuthModel, AuthType } from './entities/auth.entity';
import { UserRole } from '../user/entities/user.entity';

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
      throw new BadRequestException(`AUTH::SIGNUP::EMAIL_NOT_PROVIDED`);
    }

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
        role: [UserRole.User],
      });

      // then create auth entity
      await this.createAuthEntity({
        type: registrationDto.type,
        credentials: registrationDto.credentials,
        userId: user.id,
      });
    });

    await session.endSession();
    return user;
  }

  async createAuthEntity(createAuthDto: CreateAuthDto) {
    if (
      createAuthDto.type === AuthType.Password &&
      (await this.AuthDocument.findOne({ type: createAuthDto.type }))
    ) {
      throw new ConflictException(`AUTH::CREATE::DUPLICATED_ENTITIES`);
    }

    const authDocument = new this.AuthDocument({
      userId: createAuthDto.userId,
      credentials: createAuthDto.credentials,
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
