import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserModel, UserSchema } from './entities/user.entity';
import { AuthModel, AuthSchema } from '../auth/entities/auth.entity';
import { StorageService } from '../providers/file';

@Module({
  controllers: [UserController],
  providers: [UserService, StorageService],
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: UserModel.name, schema: UserSchema },
      { name: AuthModel.name, schema: AuthSchema },
    ]),
  ],
  exports: [UserService],
})
export class UserModule {}
