import { AuthType } from '../src/auth/entities/auth.entity';
import { RegistrationAuthDto } from '../src/auth/dto/registration-auth.dto';
import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';

export const initUserFixtures = async (app) => {
  const userPayload = {
    avatar: 'https://google.com/a.png',
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

  expect(response.statusCode).toEqual(HttpStatus.CREATED);
  expect(response.body._id).toBeTruthy();
};
