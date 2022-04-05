import * as request from 'supertest';
import { AuthType } from '../src/auth/entities/auth.entity';
import { HttpStatus } from '@nestjs/common';

import { testHelper } from './test-entrypoint.e2e-spec';

describe('[auth] Connect wallets test (e2e)', () => {
  it('should connect evm wallet successfully', async () => {
    const passwordAuthUser = testHelper.passwordAuthUser;
    const app = testHelper.app;
    const evmKeyPair = testHelper.createEvmKeyPair();

    const connectAuthChallenge = await request(app.getHttpServer())
      .post(`/api/auth/challenge/${evmKeyPair.walletAddress}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    const connectMessage = connectAuthChallenge.body.message;
    const connectAuthChallengeId = connectAuthChallenge.body._id;
    const signConnectData = evmKeyPair.sign(connectMessage);

    // Now to use access token to get profile
    const accessToken = passwordAuthUser.accessToken;
    const connectWalletResponse = await request(app.getHttpServer())
      .post('/api/auth/connect-wallet')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        userId: passwordAuthUser.userId,
        type: AuthType.EVMChain,
        credential: {
          walletAddress: evmKeyPair.walletAddress,
          signedData: signConnectData,
          authChallengeId: connectAuthChallengeId,
        },
      });

    expect(connectWalletResponse.statusCode).toEqual(HttpStatus.CREATED);
    expect(connectWalletResponse.body._id).toBeTruthy();

    // make sure the client can be logged in using evm chain
    const loginAuthChallenge = await request(app.getHttpServer())
      .post(`/api/auth/challenge/${evmKeyPair.walletAddress}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    const loginMessage = loginAuthChallenge.body.message;
    const loginAuthChallengeId = loginAuthChallenge.body._id;
    const signedLoginData = evmKeyPair.sign(loginMessage);

    // Now to login
    const userPayload = {
      username: passwordAuthUser.email,
      authType: AuthType.EVMChain,
      credential: {
        walletAddress: evmKeyPair.walletAddress,
        signedData: signedLoginData,
        authChallengeId: loginAuthChallengeId,
      },
    };

    const response = await request(app.getHttpServer())
      .post('/api/auth/login-wallet')
      .send(userPayload)
      .set('Accept', 'application/json');

    expect(response.statusCode).toEqual(HttpStatus.CREATED);
    expect(response.body.accessToken).toBeTruthy();

    // Now to use access token to get profile
    const responseAccessToken = response.body.accessToken;
    const profileResponse = await request(app.getHttpServer())
      .get('/api/auth/profile')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${responseAccessToken}`)
      .send();

    expect(profileResponse.statusCode).toEqual(HttpStatus.OK);
    expect(profileResponse.body.email).toEqual(passwordAuthUser.email);
  });

  it('should connect solana wallet successfully', async () => {
    const passwordAuthUser = testHelper.passwordAuthUser;
    const app = testHelper.app;
    const solanaKeypair = testHelper.createSolanaKeypair();

    const connectAuthChallenge = await request(app.getHttpServer())
      .post(`/api/auth/challenge/${solanaKeypair.walletAddress}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    const connectMessage = connectAuthChallenge.body.message;
    const connectAuthChallengeId = connectAuthChallenge.body._id;
    const signConnectData = solanaKeypair.sign(connectMessage);

    // Now to use access token to get profile
    const accessToken = passwordAuthUser.accessToken;
    const connectWalletResponse = await request(app.getHttpServer())
      .post('/api/auth/connect-wallet')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        userId: passwordAuthUser.userId,
        type: AuthType.Solana,
        credential: {
          walletAddress: solanaKeypair.walletAddress,
          signedData: signConnectData,
          authChallengeId: connectAuthChallengeId,
        },
      });

    expect(connectWalletResponse.statusCode).toEqual(HttpStatus.CREATED);
    expect(connectWalletResponse.body._id).toBeTruthy();

    // make sure the client can be logged in using evm chain
    const loginAuthChallenge = await request(app.getHttpServer())
      .post(`/api/auth/challenge/${solanaKeypair.walletAddress}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    const loginMessage = loginAuthChallenge.body.message;
    const loginAuthChallengeId = loginAuthChallenge.body._id;
    const signedLoginData = solanaKeypair.sign(loginMessage);

    // Now to login
    const userPayload = {
      username: passwordAuthUser.email,
      authType: AuthType.Solana,
      credential: {
        walletAddress: solanaKeypair.walletAddress,
        signedData: signedLoginData,
        authChallengeId: loginAuthChallengeId,
      },
    };

    const response = await request(app.getHttpServer())
      .post('/api/auth/login-wallet')
      .send(userPayload)
      .set('Accept', 'application/json');

    expect(response.statusCode).toEqual(HttpStatus.CREATED);
    expect(response.body.accessToken).toBeTruthy();

    // Now to use access token to get profile
    const responseAccessToken = response.body.accessToken;
    const profileResponse = await request(app.getHttpServer())
      .get('/api/auth/profile')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${responseAccessToken}`)
      .send();

    expect(profileResponse.statusCode).toEqual(HttpStatus.OK);
    expect(profileResponse.body.email).toEqual(passwordAuthUser.email);
  });
});
