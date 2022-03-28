import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { rootMongooseTestModule } from '../test.helper';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModel, UserSchema } from '../user/entities/user.entity';
import { AuthModel, AuthSchema } from './entities/auth.entity';
import { UserService } from '../user/user.service';
import { HashingService } from '../providers/hashing';
import { SignatureService } from '../providers/signature';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, UserService, HashingService, SignatureService],
      imports: [
        rootMongooseTestModule(),
        MongooseModule.forFeature([
          { name: UserModel.name, schema: UserSchema },
          { name: AuthModel.name, schema: AuthSchema },
        ]),
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
