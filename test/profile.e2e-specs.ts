import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';

import { UserService } from '../src/user/user.service';
import { testHelper } from './test-entrypoint.e2e-spec';
import { AuthType } from '../dist/auth/entities/auth.entity';
import { AuthService } from '../src/auth/auth.service';

describe('[profile] profile management', () => {
  it('should get profile successfully', async () => {
    const evmAuthUser = testHelper.evmAuthUser;
    const app = testHelper.app;
    const accessToken = evmAuthUser.accessToken;

    const profileResponse = await request(app.getHttpServer())
      .get('/api/user/profile')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .send();

    expect(profileResponse.statusCode).toEqual(HttpStatus.OK);
    expect(profileResponse.body._id).toEqual(evmAuthUser.userId);
  });

  it('should update profile successfully', async () => {
    const evmAuthUser = testHelper.evmAuthUser;
    const app = testHelper.app;
    const accessToken = evmAuthUser.accessToken;

    const payload = {
      avatar: 'https://google.com/abcxyz',
      username: `EvmAuthUserChanged`,
      removeEmail: true,
      displayName: 'Hello World',
    };

    const profileResponse = await request(app.getHttpServer())
      .put('/api/user/profile')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload);

    expect(profileResponse.statusCode).toEqual(HttpStatus.OK);
    expect(profileResponse.body.avatar).toEqual(payload.avatar);
    expect(profileResponse.body.username).toEqual(payload.username);
    expect(profileResponse.body.displayName).toEqual(payload.displayName);
    expect(profileResponse.body.email).toBeFalsy();
  });

  it('should retrieve auth entities successfully', async () => {
    const evmAuthUser = testHelper.evmAuthUser;
    const app = testHelper.app;
    const accessToken = evmAuthUser.accessToken;

    const profileResponse = await request(app.getHttpServer())
      .get(`/api/user/profile/auth-entities/`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .send();

    expect(profileResponse.statusCode).toEqual(HttpStatus.OK);
    expect(profileResponse.body.length).toEqual(1);
    expect(profileResponse.body[0].type).toEqual(AuthType.EVMChain);
  });

  it('should fail if user try to delete one last auth entity', async () => {
    const evmAuthUser = testHelper.evmAuthUser;
    const app = testHelper.app;
    const accessToken = evmAuthUser.accessToken;

    const userService = testHelper.getModule<UserService>(UserService);
    const authEntities = await userService.getUserAuthEntities(
      evmAuthUser.userId,
    );

    expect(authEntities.length).toEqual(1);

    const profileResponse = await request(app.getHttpServer())
      .delete(`/api/user/profile/auth-entities/${authEntities[0].id}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .send();

    expect(profileResponse.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it('should fail if user try to delete password auth entity', async () => {
    const targetUser = testHelper.solanaPasswordAuthUser;
    const app = testHelper.app;
    const accessToken = targetUser.accessToken;

    const userService = testHelper.getModule<UserService>(UserService);
    const authEntities = await userService.getUserAuthEntities(
      targetUser.userId,
    );

    const profileResponse = await request(app.getHttpServer())
      .delete(`/api/user/profile/auth-entities/${authEntities[0].id}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .send();

    expect(profileResponse.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it('should delete solana entity successfully', async () => {
    const targetUser = testHelper.solanaPasswordAuthUser;
    const app = testHelper.app;
    const accessToken = targetUser.accessToken;

    const userService = testHelper.getModule<UserService>(UserService);
    const authEntities = await userService.getUserAuthEntities(
      targetUser.userId,
    );

    expect(authEntities.length).toEqual(2);

    const profileResponse = await request(app.getHttpServer())
      .delete(`/api/user/profile/auth-entities/${authEntities[1].id}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .send();

    expect(profileResponse.statusCode).toEqual(HttpStatus.OK);

    const authEntitiesAfterDelete = await userService.getUserAuthEntities(
      targetUser.userId,
    );

    expect(authEntitiesAfterDelete.length).toEqual(1);
  });

  it('should connect email successfully', async () => {
    const targetUser = testHelper.solanaPasswordAuthUser;
    const app = testHelper.app;
    const accessToken = targetUser.accessToken;

    const authService = testHelper.getModule<AuthService>(AuthService);

    const newEmail = 'newemail@abcxyz.com';
    const otp = await authService.generateOtp(newEmail);

    const profileResponse = await request(app.getHttpServer())
      .post(`/api/auth/connect-email`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        email: newEmail,
        token: otp,
      });

    expect(profileResponse.statusCode).toEqual(HttpStatus.CREATED);
    expect(profileResponse.body.email).toEqual(newEmail);
  });
});
