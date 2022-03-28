import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { rootMongooseTestModule } from '../test.helper';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModel, UserSchema } from '../user/entities/user.entity';
import { AuthModel, AuthSchema } from './entities/auth.entity';
import { UserService } from '../user/user.service';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService, UserService],
      imports: [
        rootMongooseTestModule(),
        MongooseModule.forFeature([
          { name: UserModel.name, schema: UserSchema },
          { name: AuthModel.name, schema: AuthSchema },
        ]),
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
