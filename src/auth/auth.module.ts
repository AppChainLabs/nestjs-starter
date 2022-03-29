import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserService } from '../user/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModel, AuthSchema } from './entities/auth.entity';
import { UserModel, UserSchema } from '../user/entities/user.entity';
import { HashingService } from '../providers/hashing';
import { SignatureService } from '../providers/signature';
import { WalletAuthStrategy } from './wallet-auth.strategy';
import { PasswordAuthStrategy } from './password-auth.strategy';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    UserService,
    HashingService,
    SignatureService,
    WalletAuthStrategy,
    PasswordAuthStrategy,
  ],
  imports: [
    // Inject db model
    MongooseModule.forFeature([
      { name: UserModel.name, schema: UserSchema },
      { name: AuthModel.name, schema: AuthSchema },
    ]),
  ],
})
export class AuthModule {}
