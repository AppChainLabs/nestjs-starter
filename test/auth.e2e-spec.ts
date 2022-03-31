import { HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { Keypair } from '@solana/web3.js';

import { AuthType, WalletCredential } from '../src/auth/entities/auth.entity';
import { RegistrationAuthDto } from '../src/auth/dto/registration-auth.dto';
import { TestHelper } from './test.helper';
import { sign } from 'tweetnacl';
import * as bs from 'bs58';
import { AuthService } from '../src/auth/auth.service';

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

  it('should signup with password successfully', async () => {
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

  it('should login with password and retrieve profile successfully', async () => {
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

  it('should sign up with solana sign successfully', async () => {
    const app = testHelper.app;

    // Using this to sign and verify for solana https://stackoverflow.com/a/68309864

    // Step 1: Generate Solana keypair
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toBase58();

    // Step 2: Now to get http challenge
    const authChallengeResponse = await request(app.getHttpServer())
      .post(`/api/auth/challenge/${publicKey}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(authChallengeResponse.statusCode).toEqual(HttpStatus.CREATED);
    expect(authChallengeResponse.body._id).toBeTruthy();
    expect(authChallengeResponse.body.message).toBeTruthy();

    // Step 3: Sign data
    const message = authChallengeResponse.body.message;
    const authChallengeId = authChallengeResponse.body._id;

    const encodedMessage = new TextEncoder().encode(message);
    const signedData = sign.detached(encodedMessage, keypair.secretKey);
    const encodedSignedMessage = bs.encode(signedData);

    // Step 4: Sign up with credentials
    const userPayload = {
      avatar: 'https://google.com/image.png',
      email: 'userxyz@userxyz.userxyz',
      username: 'user',
      displayName: 'user user',
      type: AuthType.Solana,
      credential: {
        walletAddress: publicKey,
        signedData: encodedSignedMessage,
        authChallengeId,
      },
    } as RegistrationAuthDto;

    const response = await request(app.getHttpServer())
      .post('/api/auth/sign-up')
      .send(userPayload)
      .set('Accept', 'application/json');

    expect(response.statusCode).toEqual(HttpStatus.CREATED);
    expect(response.body._id).toBeTruthy();

    // Step 5: Just check again that the auth entity was created
    const authService = testHelper.getModule<AuthService>(AuthService);

    const authChallenge = await authService.findAuthChallengeById(
      authChallengeId,
    );
    expect(authChallenge).toBeTruthy();
    expect(authChallenge.isResolved).toEqual(true);

    const authEntity = await authService.findAuthEntityWithUserId(
      AuthType.Solana,
      response.body._id,
      publicKey,
    );
    expect(authEntity._id).toBeTruthy();
    expect((authEntity.credential as WalletCredential).walletAddress).toEqual(
      publicKey,
    );
  });
});
