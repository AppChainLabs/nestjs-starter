import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserService } from '../user/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModel, AuthSchema } from './entities/auth.entity';
import { UserModel, UserSchema } from '../user/entities/user.entity';

@Module({
  controllers: [AuthController],
  providers: [AuthService, UserService],
  imports: [
    // Inject db model
    MongooseModule.forFeature([
      { name: UserModel.name, schema: UserSchema },
      { name: AuthModel.name, schema: AuthSchema },
    ]),
  ],
})
export class AuthModule {}
