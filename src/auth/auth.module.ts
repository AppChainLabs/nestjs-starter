import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserService } from '../user/user.service';
import { AuthModel, AuthSchema } from './entities/auth.entity';
import { UserModel, UserSchema } from '../user/entities/user.entity';
import { HashingService } from '../providers/hashing';
import { SignatureService } from '../providers/signature';
import { WalletAuthStrategy } from './wallet-auth.strategy';
import { PasswordAuthStrategy } from './password-auth.strategy';
import { Jwt } from '../providers/jwt';
import { JwtStrategy } from './jwt-auth.strategy';
import {
  AuthModelSchema,
  AuthSessionModel,
} from './entities/auth-session.entity';
import {
  AuthChallengeModel,
  AuthChallengeSchema,
} from './entities/auth-challenge.entity';
import { Otp } from '../providers/otp';
import { Email } from '../providers/email';
import { StorageService } from '../providers/file';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    UserService,
    HashingService,
    SignatureService,
    WalletAuthStrategy,
    PasswordAuthStrategy,
    JwtStrategy,
    Jwt,
    Otp,
    Email,
    StorageService,
  ],
  imports: [
    ConfigModule,
    // Inject db model
    MongooseModule.forFeature([
      { name: UserModel.name, schema: UserSchema },
      { name: AuthModel.name, schema: AuthSchema },
      { name: AuthSessionModel.name, schema: AuthModelSchema },
      { name: AuthChallengeModel.name, schema: AuthChallengeSchema },
    ]),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const jwtService = new Jwt(configService);

        const options: JwtModuleOptions = {
          secret: jwtService.getKeyPair().privateKey,
          privateKey: jwtService.getKeyPair().privateKey,
          publicKey: jwtService.getKeyPair().publicKey,
          signOptions: jwtService.getSignInOptions(),
        };
        return options;
      },
      inject: [ConfigService],
    }),
  ],
})
export class AuthModule {}
