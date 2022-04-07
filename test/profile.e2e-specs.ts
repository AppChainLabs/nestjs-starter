import { testHelper } from './test-entrypoint.e2e-spec';
import * as request from 'supertest';
import { AuthType } from '../src/auth/entities/auth.entity';
import { HttpStatus } from '@nestjs/common';

describe('[profile] profile management', () => {
  it('should fail if user try to delete one last auth entity', async () => {
    const evmAuthUser = testHelper.evmAuthUser;
    const app = testHelper.app;

    const accessToken = evmAuthUser.accessToken;
    // const profileResponse = await request(app.getHttpServer())
    //   .post('/api/auth/connect-wallet')
    //   .set('Content-Type', 'application/json')
    //   .set('Accept', 'application/json')
    //   .set('Authorization', `Bearer ${accessToken}`)
    //   .send({
    //     userId: passwordAuthUser.userId,
    //     type: AuthType.Solana,
    //     credential: {
    //       walletAddress: evmKeyPair.walletAddress,
    //       signedData: signConnectData,
    //       authChallengeId: connectAuthChallengeId,
    //     },
    //   });
    //
    // expect(connectWalletResponse.statusCode).toEqual(HttpStatus.CONFLICT);
  });
});
