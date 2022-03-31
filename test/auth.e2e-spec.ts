import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import mongoose from 'mongoose';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import { AuthType } from '../src/auth/entities/auth.entity';
import { RegistrationAuthDto } from '../src/auth/dto/registration-auth.dto';
import { closeInMongodConnection } from '../src/helper';
import { globalApply } from '../src/main';
import { initUserFixtures } from './fixtures.test-helper';

describe('/api/auth/sign-up (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    globalApply(app);

    await app.init();

    // import fixtures
    await initUserFixtures(app);
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await closeInMongodConnection();
    await moduleFixture.close();
    await app.close();
  });

  it('invalid payload, should fail to signup', async () => {
    const userPayload = {
      avatar: 'httpsgoogle.',
      email: 'test@gmail.com',
      username: 'test',
      displayName: 'abc xyz',
      type: AuthType.Password,
      credential: {
        password: '123456',
      },
    } as RegistrationAuthDto;

    const response = await request(app.getHttpServer())
      .post('/api/auth/sign-up')
      .send(userPayload)
      .set('Accept', 'application/json');

    console.log(response.body);

    expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
  });
});
