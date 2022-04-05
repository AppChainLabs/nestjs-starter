import * as request from 'supertest';
import { AuthType } from '../src/auth/entities/auth.entity';
import { HttpStatus } from '@nestjs/common';

import { testHelper } from './test-entrypoint.e2e-spec';

describe('[auth user] Connect wallets test (e2e)', () => {
  it('[password auth user] should connect evm wallet successfully', async () => {
    const passwordAuthUser = testHelper.passwordAuthUser;
    const app = testHelper.app;
    const evmKeyPair = testHelper.createEvmKeyPair();

    const loginAuthChallenge = await request(app.getHttpServer())
      .post(`/api/auth/challenge/${evmKeyPair.walletAddress}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    const loginMessage = loginAuthChallenge.body.message;
    const loginAuthChallengeId = loginAuthChallenge.body._id;
    const signedLoginData = evmKeyPair.sign(loginMessage);

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
          signedData: signedLoginData,
          authChallengeId: loginAuthChallengeId,
        },
      });

    expect(connectWalletResponse.statusCode).toEqual(HttpStatus.CREATED);
    expect(connectWalletResponse.body._id).toBeTruthy();
  });
});
