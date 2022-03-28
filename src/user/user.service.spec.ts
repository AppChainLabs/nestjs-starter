import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';

import { UserService } from './user.service';
import { rootMongooseTestModule } from '../test.helper';
import { UserModel, UserSchema } from './entities/user.entity';
import { AuthModel, AuthSchema } from '../auth/entities/auth.entity';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService],
      imports: [
        rootMongooseTestModule(),
        MongooseModule.forFeature([
          { name: UserModel.name, schema: UserSchema },
          { name: AuthModel.name, schema: AuthSchema },
        ]),
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
