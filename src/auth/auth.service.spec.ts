import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { rootMongooseTestModule } from '../test.helper';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModel, UserSchema } from '../user/entities/user.entity';
import { AuthModel, AuthSchema } from './entities/auth.entity';
import { UserService } from '../user/user.service';
import { HashingService } from '../providers/hashing';
import { SignatureService } from '../providers/signature';
import {
  AuthModelSchema,
  AuthSessionModel,
} from './entities/auth-session.entity';
import { JwtModule, JwtModuleOptions, JwtService } from '@nestjs/jwt';
import { Jwt } from '../providers/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UserService,
        HashingService,
        SignatureService,
        Jwt,
      ],
      imports: [
        rootMongooseTestModule(),
        ConfigModule,
        MongooseModule.forFeature([
          { name: UserModel.name, schema: UserSchema },
          { name: AuthModel.name, schema: AuthSchema },
          { name: AuthSessionModel.name, schema: AuthModelSchema },
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
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
