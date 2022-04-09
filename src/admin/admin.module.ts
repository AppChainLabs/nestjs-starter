import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UserModule } from '../user/user.module';
import { UserModel, UserSchema } from '../user/entities/user.entity';
import { AuthModel, AuthSchema } from '../auth/entities/auth.entity';
import {
  AuthModelSchema,
  AuthSessionModel,
} from '../auth/entities/auth-session.entity';
import {
  AuthChallengeModel,
  AuthChallengeSchema,
} from '../auth/entities/auth-challenge.entity';
import { ConfigModule } from '@nestjs/config';
import { PasswordAuthStrategy } from '../auth/password-auth.strategy';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [AdminController],
  providers: [AdminService, PasswordAuthStrategy],
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: UserModel.name, schema: UserSchema },
      { name: AuthModel.name, schema: AuthSchema },
      { name: AuthSessionModel.name, schema: AuthModelSchema },
      { name: AuthChallengeModel.name, schema: AuthChallengeSchema },
    ]),
    UserModule,
    AuthModule,
  ],
})
export class AdminModule {}
