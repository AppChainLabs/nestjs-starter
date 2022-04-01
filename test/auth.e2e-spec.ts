import { HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { Keypair } from '@solana/web3.js';
import { sign } from 'tweetnacl';
import * as bs from 'bs58';

import { AuthType, WalletCredential } from '../src/auth/entities/auth.entity';
import { RegistrationAuthDto } from '../src/auth/dto/registration-auth.dto';
import { TestHelper } from './test.helper';

import { AuthService } from '../src/auth/auth.service';

describe('registration/login flows (e2e)', () => {
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
      .set('Accept', 'application/json')
      .send(userPayload);

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
      username: 'user@password.auth',
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

    // Phase 1: Should sign up with solana successfully
    // Step 1: Now to get http challenge
    const authChallengeResponse = await request(app.getHttpServer())
      .post(`/api/auth/challenge/${publicKey}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(authChallengeResponse.statusCode).toEqual(HttpStatus.CREATED);
    expect(authChallengeResponse.body._id).toBeTruthy();
    expect(authChallengeResponse.body.message).toBeTruthy();

    // Step 2: Sign data
    const message = authChallengeResponse.body.message;
    const authChallengeId = authChallengeResponse.body._id;

    const encodedMessage = new TextEncoder().encode(message);
    const signedData = sign.detached(encodedMessage, keypair.secretKey);
    const encodedSignedMessage = bs.encode(signedData);

    // Step 3: Sign up with credentials
    const signUpUserPayload = {
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

    const signUpResponse = await request(app.getHttpServer())
      .post('/api/auth/sign-up')
      .send(signUpUserPayload)
      .set('Accept', 'application/json');

    expect(signUpResponse.statusCode).toEqual(HttpStatus.CREATED);
    expect(signUpResponse.body._id).toBeTruthy();

    // Step 4: Just check again that the auth entity was created
    const authService = testHelper.getModule<AuthService>(AuthService);

    const authChallenge = await authService.findAuthChallengeById(
      authChallengeId,
    );
    expect(authChallenge).toBeTruthy();
    expect(authChallenge.isResolved).toEqual(true);

    const authEntity = await authService.findAuthEntityWithUserId(
      AuthType.Solana,
      signUpResponse.body._id,
      publicKey,
    );
    expect(authEntity._id).toBeTruthy();
    expect((authEntity.credential as WalletCredential).walletAddress).toEqual(
      publicKey,
    );

    // Phase 2: Should login successfully using the above credentials, no need to assert for auth challenge response
    // First get auth challenge
    const loginAuthChallenge = await request(app.getHttpServer())
      .post(`/api/auth/challenge/${publicKey}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    const loginMessage = loginAuthChallenge.body.message;
    const loginAuthChallengeId = loginAuthChallenge.body._id;

    const encodedLoginMessage = new TextEncoder().encode(loginMessage);
    const signedLoginData = sign.detached(
      encodedLoginMessage,
      keypair.secretKey,
    );
    const encodedLoginSignedMessage = bs.encode(signedLoginData);

    // Now to login
    const userPayload = {
      username: 'userxyz@userxyz.userxyz',
      authType: AuthType.Solana,
      credential: {
        walletAddress: publicKey,
        signedData: encodedLoginSignedMessage,
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
    const accessToken = response.body.accessToken;
    const profileResponse = await request(app.getHttpServer())
      .get('/api/auth/profile')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .send();

    expect(profileResponse.statusCode).toEqual(HttpStatus.OK);
    expect(profileResponse.body.email).toEqual(userPayload.username);
  });

  it('should sign up with evm web3 sign successfully', async () => {
    const app = testHelper.app;

    // Using this to sign and verify for solana https://stackoverflow.com/a/68309864

    // Step 1: Generate Solana keypair
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Web3 = require('web3');
    const w3 = new Web3();
    const account = w3.eth.accounts.create();

    // Phase 1: Should sign up with solana successfully
    // Step 1: Now to get http challenge
    const authChallengeResponse = await request(app.getHttpServer())
      .post(`/api/auth/challenge/${account.address}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(authChallengeResponse.statusCode).toEqual(HttpStatus.CREATED);
    expect(authChallengeResponse.body._id).toBeTruthy();
    expect(authChallengeResponse.body.message).toBeTruthy();

    // Step 2: Sign data
    const message = authChallengeResponse.body.message;
    const authChallengeId = authChallengeResponse.body._id;

    const signedData = account.sign(message);

    // Step 3: Sign up with credentials
    const signUpUserPayload = {
      avatar: 'https://google.com/image.png',
      email: 'userxyz@userxyz.userxyz',
      username: 'user',
      displayName: 'user user',
      type: AuthType.EVMChain,
      credential: {
        walletAddress: account.address,
        signedData: signedData.signature,
        authChallengeId,
      },
    } as RegistrationAuthDto;

    const signUpResponse = await request(app.getHttpServer())
      .post('/api/auth/sign-up')
      .send(signUpUserPayload)
      .set('Accept', 'application/json');

    expect(signUpResponse.statusCode).toEqual(HttpStatus.CREATED);
    expect(signUpResponse.body._id).toBeTruthy();

    // Step 4: Just check again that the auth entity was created
    const authService = testHelper.getModule<AuthService>(AuthService);

    const authChallenge = await authService.findAuthChallengeById(
      authChallengeId,
    );
    expect(authChallenge).toBeTruthy();
    expect(authChallenge.isResolved).toEqual(true);

    const authEntity = await authService.findAuthEntityWithUserId(
      AuthType.EVMChain,
      signUpResponse.body._id,
      account.address,
    );
    expect(authEntity._id).toBeTruthy();
    expect((authEntity.credential as WalletCredential).walletAddress).toEqual(
      account.address,
    );

    // Phase 2: Should login successfully using the above credentials, no need to assert for auth challenge response
    // First get auth challenge
    const loginAuthChallenge = await request(app.getHttpServer())
      .post(`/api/auth/challenge/${account.address}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    const loginMessage = loginAuthChallenge.body.message;
    const loginAuthChallengeId = loginAuthChallenge.body._id;

    const signedLoginData = account.sign(loginMessage);

    // Now to login
    const userPayload = {
      username: 'userxyz@userxyz.userxyz',
      authType: AuthType.EVMChain,
      credential: {
        walletAddress: account.address,
        signedData: signedLoginData.signature,
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
    const accessToken = response.body.accessToken;
    const profileResponse = await request(app.getHttpServer())
      .get('/api/auth/profile')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)
      .send();

    expect(profileResponse.statusCode).toEqual(HttpStatus.OK);
    expect(profileResponse.body.email).toEqual(userPayload.username);
  });
});
