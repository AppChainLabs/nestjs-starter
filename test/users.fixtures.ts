import { AuthType } from '../src/auth/entities/auth.entity';
import { RegistrationAuthDto } from '../src/auth/dto/registration-auth.dto';
import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';

export const initUserFixtures = async (app) => {
  const userPayload = {
    avatar: 'https://google.com/userA.png',
    email: 'userA@userA.userA',
    username: 'userA',
    displayName: 'userA displayName',
    type: AuthType.Password,
    credential: {
      password: '123456',
    },
  } as RegistrationAuthDto;

  const response = await request(app.getHttpServer())
    .post('/api/auth/sign-up')
    .set('Accept', 'application/json')
    .send(userPayload);

  expect(response.statusCode).toEqual(HttpStatus.CREATED);
  expect(response.body._id).toBeTruthy();
};
