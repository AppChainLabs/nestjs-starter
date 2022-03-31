import { HttpStatus } from '@nestjs/common';
import * as request from 'supertest';

import { AuthType } from '../src/auth/entities/auth.entity';
import { RegistrationAuthDto } from '../src/auth/dto/registration-auth.dto';
import { TestHelper } from './test.helper';

describe('/api/auth/sign-up (e2e)', () => {
  const testHelper = new TestHelper();

  beforeEach(async () => {
    await testHelper.bootTestingApp();
  });

  afterEach(async () => {
    await testHelper.shutDownTestingApp();
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

  it('should signup successfully', async () => {
    const userPayload = {
      avatar: 'https://google.com/image.png',
      email: 'user@user.user',
      username: 'user',
      displayName: 'user user',
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

    expect(response.statusCode).toEqual(HttpStatus.CREATED);
    expect(response.body._id).toBeTruthy();
  });

  it('should login and retrieve successfully', async () => {
    const loginPayload = {
      username: 'userA@userA.userA',
      password: '123456',
    };

    const app = testHelper.app;

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send(loginPayload);

    expect(response.statusCode).toEqual(HttpStatus.CREATED);
    expect(response.body.accessToken).toBeTruthy();

    const profileResponse = await request(app.getHttpServer())
      .get('/api/auth/profile')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${response.body.accessToken}`)
      .send();

    expect(profileResponse.statusCode).toEqual(HttpStatus.OK);
    expect(profileResponse.body.email).toEqual(loginPayload.username);
  });
});
