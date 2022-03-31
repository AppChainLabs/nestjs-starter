import { HttpStatus } from '@nestjs/common';
import * as request from 'supertest';

import { AuthType } from '../src/auth/entities/auth.entity';
import { RegistrationAuthDto } from '../src/auth/dto/registration-auth.dto';
import { TestHelper } from './test.helper';

describe('/api/auth/sign-up (e2e)', () => {
  const testHelper = new TestHelper();

  beforeAll(async () => {
    await testHelper.beforeAll();
  });

  afterAll(async () => {
    await testHelper.afterAll();
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

    const app = testHelper.app;
    const response = await request(app.getHttpServer())
      .post('/api/auth/sign-up')
      .send(userPayload)
      .set('Accept', 'application/json');

    expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
  });
});
