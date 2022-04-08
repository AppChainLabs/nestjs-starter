import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModel, UserSchema } from './entities/user.entity';
import { AuthModel, AuthSchema } from '../auth/entities/auth.entity';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [
    MongooseModule.forFeature([
      { name: UserModel.name, schema: UserSchema },
      { name: AuthModel.name, schema: AuthSchema },
    ]),
  ],
})
export class UserModule {}
