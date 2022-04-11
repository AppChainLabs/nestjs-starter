import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import mongoose from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';

import { UserService } from '../src/user/user.service';
import { testHelper } from './test-entrypoint.e2e-spec';
import { AuthType } from '../src/auth/entities/auth.entity';
import { AuthService } from '../src/auth/auth.service';
import {
  AuthSessionModel,
  SessionType,
} from '../src/auth/entities/auth-session.entity';

describe('[profile] profile management tests (e2e)', () => {
  it('should send email for wallet connect link successfully', async () => {
    const passwordAuthUser = testHelper.passwordAuthUser;
    const app = testHelper.app;

    const RefAuthSessionDocument = testHelper.getModule<
      mongoose.Model<AuthSessionModel>
    >(getModelToken(AuthSessionModel.name));

    const authDocumentsBefore = await RefAuthSessionDocument.find(
      {
        userId: passwordAuthUser.userId,
      },
      {},
      { sort: '-createdAt' },
    );

    expect(authDocumentsBefore.length).toBeGreaterThanOrEqual(1);

    const profileResponse = await request(app.getHttpServer())
      .post(`/api/auth/send-connect-wallet-link/${passwordAuthUser.email}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send();

    expect(profileResponse.statusCode).toEqual(HttpStatus.CREATED);

    const authChallenges = await RefAuthSessionDocument.find(
      {
        userId: passwordAuthUser.userId,
      },
      {},
      { sort: '-createdAt' },
    );

    expect(authChallenges.length).toEqual(authDocumentsBefore.length + 1);
    expect(authChallenges[0].sessionType).toEqual(SessionType.ResetCredential);
  });

  it('should send email otp verification successfully', async () => {
    const app = testHelper.app;
    const newEmail = 'testxyz@email.ok';

    const profileResponse = await request(app.getHttpServer())
      .post(`/api/auth/send-email-verification/${newEmail}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send();

    expect(profileResponse.statusCode).toEqual(HttpStatus.CREATED);

    const authService = testHelper.getModule<AuthService>(AuthService);
    const authChallenges = await authService.findAuthChallengesByTarget(
      newEmail,
    );
    expect(authChallenges.length).toEqual(1);
  });

  it('should fail if validate an existed wallet address', async () => {
    const evmAuthUser = testHelper.evmAuthUser;
    const app = testHelper.app;

    const profileResponse = await request(app.getHttpServer())
      .post(`/api/user/validate/wallet-address/${evmAuthUser.walletAddress}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send();

    expect(profileResponse.statusCode).toEqual(HttpStatus.CONFLICT);
  });

  it('should fail if validate an existed username/email', async () => {
    const passwordAuthUser = testHelper.passwordAuthUser;
    const app = testHelper.app;

    const profileResponse = await request(app.getHttpServer())
      .post(`/api/user/validate/username/${passwordAuthUser.email}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send();

    expect(profileResponse.statusCode).toEqual(HttpStatus.CONFLICT);
  });

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
      username: `EvmAuthUserChanged`,
      removeEmail: true,
    };

    const profileResponse = await request(app.getHttpServer())
      .put('/api/user/profile')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload);

    expect(profileResponse.statusCode).toEqual(HttpStatus.OK);
    expect(profileResponse.body.username).toEqual(payload.username);
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

  it("should fail if user try to make other's auth as primary entity", async () => {
    const evmAuthUser = testHelper.evmAuthUser;
    const passwordUser = testHelper.passwordAuthUser;
    const app = testHelper.app;
    const accessToken = passwordUser.accessToken;

    const userService = testHelper.getModule<UserService>(UserService);
    const authEntities = await userService.getUserAuthEntities(
      evmAuthUser.userId,
    );

    expect(authEntities.length).toEqual(1);

    const profileResponse = await request(app.getHttpServer())
      .post(
        `/api/user/profile/auth-entities/${authEntities[0].id}/make-primary`,
      )
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .send();

    expect(profileResponse.statusCode).toEqual(HttpStatus.FORBIDDEN);
  });

  it('should fail if user try to delete primary auth entity', async () => {
    const targetUser = testHelper.solanaPasswordAuthUser;
    const app = testHelper.app;
    const accessToken = targetUser.accessToken;

    const userService = testHelper.getModule<UserService>(UserService);
    const authEntities = await userService.getUserAuthEntities(
      targetUser.userId,
    );

    expect(authEntities[0].isPrimary).toEqual(true);

    const profileResponse = await request(app.getHttpServer())
      .delete(`/api/user/profile/auth-entities/${authEntities[0].id}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .send();

    expect(profileResponse.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it('should change primary auth entity successfully', async () => {
    const solanaPasswordAuthUser = testHelper.solanaPasswordAuthUser;
    const app = testHelper.app;
    const accessToken = solanaPasswordAuthUser.accessToken;

    const userService = testHelper.getModule<UserService>(UserService);
    const authEntities = await userService.getUserAuthEntities(
      solanaPasswordAuthUser.userId,
    );

    expect(authEntities.length).toEqual(2);
    expect(authEntities[0].isPrimary).toEqual(true);
    expect(authEntities[1].isPrimary).toEqual(false);

    const profileResponse = await request(app.getHttpServer())
      .post(
        `/api/user/profile/auth-entities/${authEntities[1].id}/make-primary`,
      )
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .send();

    expect(profileResponse.statusCode).toEqual(HttpStatus.CREATED);

    const authEntitiesAfterChanges = await userService.getUserAuthEntities(
      solanaPasswordAuthUser.userId,
    );

    expect(authEntitiesAfterChanges.length).toEqual(2);
    expect(authEntitiesAfterChanges[0].isPrimary).toEqual(false);
    expect(authEntitiesAfterChanges[1].isPrimary).toEqual(true);
  });

  it('should delete other non-primary auth entity successfully', async () => {
    const targetUser = testHelper.solanaPasswordAuthUser;
    const app = testHelper.app;
    const accessToken = targetUser.accessToken;

    const userService = testHelper.getModule<UserService>(UserService);
    const authEntities = await userService.getUserAuthEntities(
      targetUser.userId,
    );

    expect(authEntities.length).toEqual(2);
    expect(authEntities[0].isPrimary).toEqual(false);
    expect(authEntities[1].isPrimary).toEqual(true);

    const profileResponse = await request(app.getHttpServer())
      .delete(`/api/user/profile/auth-entities/${authEntities[0].id}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .send();

    expect(profileResponse.statusCode).toEqual(HttpStatus.NO_CONTENT);

    const authEntitiesAfterDelete = await userService.getUserAuthEntities(
      targetUser.userId,
    );

    expect(authEntitiesAfterDelete.length).toEqual(1);
    expect(authEntitiesAfterDelete[0].isPrimary).toEqual(true);
  });

  it('should connect email successfully', async () => {
    const targetUser = testHelper.solanaAuthUser;
    const app = testHelper.app;
    const accessToken = targetUser.accessToken;

    const newEmail = 'newemail@abcxyz.com';
    const authService = testHelper.getModule<AuthService>(AuthService);
    const userService = testHelper.getModule<UserService>(UserService);
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

    const userDoc = await userService.findByEmail(newEmail);
    expect(userDoc.email).toEqual(newEmail);
    expect(userDoc.id).toEqual(targetUser.userId);
  });
});
