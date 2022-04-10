import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';

import { testHelper } from './test-entrypoint.e2e-spec';
import { AuthService } from '../src/auth/auth.service';
import { UserService } from '../src/user/user.service';
import { SessionType } from '../src/auth/entities/auth-session.entity';
import { AuthType } from '../src/auth/entities/auth.entity';

describe('[auth] auth token and session tests (e2e)', () => {
  it('should pass if use reset credential to request reset credential required resource (aka connect wallet via email link)', async () => {
    const passwordAuthUser = testHelper.passwordAuthUser;
    const app = testHelper.app;

    const authService = testHelper.getModule<AuthService>(AuthService);
    const userService = testHelper.getModule<UserService>(UserService);
    const user = await userService.findById(passwordAuthUser.userId);

    const solanaKeypair = testHelper.createSolanaKeypair();

    const { accessToken } = await authService.generateAccessToken(
      'reset-credential-auth',
      { authEntity: {} as any, user },
      SessionType.ResetCredential,
    );

    const connectAuthChallenge = await request(app.getHttpServer())
      .post(`/api/auth/challenge/${solanaKeypair.walletAddress}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    const connectMessage = connectAuthChallenge.body.message;
    const connectAuthChallengeId = connectAuthChallenge.body._id;
    const signConnectData = solanaKeypair.sign(connectMessage);

    // Now to use access token to get profile
    const connectWalletResponse = await request(app.getHttpServer())
      .post('/api/auth/connect-wallet')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: AuthType.Solana,
        credential: {
          walletAddress: solanaKeypair.walletAddress,
          signedData: signConnectData,
          authChallengeId: connectAuthChallengeId,
        },
      });

    expect(connectWalletResponse.statusCode).toEqual(HttpStatus.CREATED);
    expect(connectWalletResponse.body._id).toBeTruthy();
  });

  it('should fail if use reset credential to request auth-required resource', async () => {
    const passwordAuthUser = testHelper.passwordAuthUser;
    const app = testHelper.app;

    const authService = testHelper.getModule<AuthService>(AuthService);
    const userService = testHelper.getModule<UserService>(UserService);
    const user = await userService.findById(passwordAuthUser.userId);

    const { accessToken } = await authService.generateAccessToken(
      'reset-credential-auth',
      { authEntity: {} as any, user },
      SessionType.ResetCredential,
    );

    const profileResponse = await request(app.getHttpServer())
      .get('/api/user/profile')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .send();

    expect(profileResponse.statusCode).toEqual(HttpStatus.FORBIDDEN);
  });

  it('should request auth-required resource successfully if auth session type is used', async () => {
    const passwordAuthUser = testHelper.passwordAuthUser;
    const app = testHelper.app;

    const authService = testHelper.getModule<AuthService>(AuthService);
    const userService = testHelper.getModule<UserService>(UserService);
    const user = await userService.findById(passwordAuthUser.userId);

    const { accessToken } = await authService.generateAccessToken(
      'reset-credential-auth',
      { authEntity: {} as any, user },
      SessionType.Auth,
    );

    const profileResponse = await request(app.getHttpServer())
      .get('/api/user/profile')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .send();

    expect(profileResponse.statusCode).toEqual(HttpStatus.OK);
  });

  it('should fail if normal user requests admin resource', async () => {
    const passwordAuthUser = testHelper.passwordAuthUser;
    const app = testHelper.app;

    const profileResponse = await request(app.getHttpServer())
      .get(`/api/admin/user/${passwordAuthUser.userId}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${passwordAuthUser.accessToken}`)
      .send();

    expect(profileResponse.statusCode).toEqual(HttpStatus.FORBIDDEN);
  });

  it('should pass if admin user requests admin resource', async () => {
    const adminAuthUser = testHelper.userAuthAdmin;
    const app = testHelper.app;

    const profileResponse = await request(app.getHttpServer())
      .get(`/api/admin/user/${adminAuthUser.userId}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${adminAuthUser.accessToken}`)
      .send();

    expect(profileResponse.statusCode).toEqual(HttpStatus.OK);
    expect(profileResponse.body._id).toEqual(adminAuthUser.userId);
  });

  it('should fail if admin try to login using normal endpoint', async () => {
    const adminAuthUser = testHelper.userAuthAdmin;
    const app = testHelper.app;

    // first try to login using normal endpoint
    const loginPayload = {
      username: adminAuthUser.email,
      password: adminAuthUser.password,
    };

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send(loginPayload);

    expect(loginResponse.statusCode).toEqual(HttpStatus.FORBIDDEN);

    // then try to connect wallet to admin
    const solanaKeypair = testHelper.createSolanaKeypair();

    const connectAuthChallenge = await request(app.getHttpServer())
      .post(`/api/auth/challenge/${solanaKeypair.walletAddress}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    const connectMessage = connectAuthChallenge.body.message;
    const connectAuthChallengeId = connectAuthChallenge.body._id;
    const signConnectData = solanaKeypair.sign(connectMessage);

    // Now to use access token to get profile
    const accessToken = adminAuthUser.accessToken;
    const connectWalletResponse = await request(app.getHttpServer())
      .post('/api/auth/connect-wallet')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: AuthType.Solana,
        credential: {
          walletAddress: solanaKeypair.walletAddress,
          signedData: signConnectData,
          authChallengeId: connectAuthChallengeId,
        },
      });

    expect(connectWalletResponse.statusCode).toEqual(HttpStatus.CREATED);
    expect(connectWalletResponse.body._id).toBeTruthy();

    // now try to login using wallet above
    const loginAuthChallenge = await request(app.getHttpServer())
      .post(`/api/auth/challenge/${solanaKeypair.walletAddress}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    const loginMessage = loginAuthChallenge.body.message;
    const loginAuthChallengeId = loginAuthChallenge.body._id;
    const signedLoginData = solanaKeypair.sign(loginMessage);

    // Now to use access token to get profile
    const loginWalletResponse = await request(app.getHttpServer())
      .post('/api/auth/login-wallet')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: AuthType.Solana,
        credential: {
          walletAddress: solanaKeypair.walletAddress,
          signedData: signedLoginData,
          authChallengeId: loginAuthChallengeId,
        },
      });

    expect(loginWalletResponse.statusCode).toEqual(HttpStatus.FORBIDDEN);
  });
});
