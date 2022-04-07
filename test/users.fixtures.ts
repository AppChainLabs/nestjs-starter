import { AuthType, WalletCredential } from '../src/auth/entities/auth.entity';
import { RegistrationAuthDto } from '../src/auth/dto/registration-auth.dto';
import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { Keypair } from '@solana/web3.js';
import { sign } from 'tweetnacl';
import * as bs from 'bs58';
import { UserService } from '../src/user/user.service';
import { UserRole } from '../src/user/entities/user.entity';
import { testHelper } from './test-entrypoint.e2e-spec';

export const initUserAdmin = async (app, userService: UserService) => {
  const userPayload = {
    avatar: 'https://google.com/userA.png',
    email: 'user@admin.auth',
    username: 'UserAdminAuth',
    displayName: 'user admin auth',
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

  const userObj = await userService.findById(response.body._id);
  userObj.roles = [UserRole.SystemAdmin];
  await userObj.save();

  const loginPayload = {
    username: 'user@admin.auth',
    password: '123456',
  };

  const loginResponse = await request(app.getHttpServer())
    .post('/api/auth/login')
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .send(loginPayload);

  expect(loginResponse.statusCode).toEqual(HttpStatus.CREATED);
  expect(loginResponse.body.accessToken).toBeTruthy();

  const profileResponse = await request(app.getHttpServer())
    .get('/api/user/profile')
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
    .send();

  expect(profileResponse.statusCode).toEqual(HttpStatus.OK);
  expect(profileResponse.body.email).toEqual(loginPayload.username);
  expect(profileResponse.body.roles[0]).toEqual(UserRole.SystemAdmin);

  return {
    userId: response.body._id,
    email: userPayload.email,
    password: '123456',
    accessToken: loginResponse.body.accessToken,
  };
};

export const initUsersWithSolanaPasswordAuth = async (app) => {
  const userPayload = {
    avatar: 'https://google.com/userA.png',
    email: 'user@solana.password.auth',
    username: 'UserSolanaPasswordAuth',
    displayName: 'user password auth',
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

  const loginPayload = {
    username: 'user@solana.password.auth',
    password: '123456',
  };

  const loginResponse = await request(app.getHttpServer())
    .post('/api/auth/login')
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .send(loginPayload);

  expect(loginResponse.statusCode).toEqual(HttpStatus.CREATED);
  expect(loginResponse.body.accessToken).toBeTruthy();

  const profileResponse = await request(app.getHttpServer())
    .get('/api/user/profile')
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
    .send();

  expect(profileResponse.statusCode).toEqual(HttpStatus.OK);
  expect(profileResponse.body.email).toEqual(loginPayload.username);

  const solanaKeypair = testHelper.createSolanaKeypair();

  const connectAuthChallenge = await request(app.getHttpServer())
    .post(`/api/auth/challenge/${solanaKeypair.walletAddress}`)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json');

  const connectMessage = connectAuthChallenge.body.message;
  const connectAuthChallengeId = connectAuthChallenge.body._id;
  const signConnectData = solanaKeypair.sign(connectMessage);

  // Now to use access token to get profile
  const accessToken = loginResponse.body.accessToken;
  const connectWalletResponse = await request(app.getHttpServer())
    .post('/api/auth/connect-wallet')
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      userId: response.body._id,
      type: AuthType.Solana,
      credential: {
        walletAddress: solanaKeypair.walletAddress,
        signedData: signConnectData,
        authChallengeId: connectAuthChallengeId,
      },
    });

  expect(connectWalletResponse.statusCode).toEqual(HttpStatus.CREATED);
  expect(connectWalletResponse.body._id).toBeTruthy();

  return {
    userId: response.body._id,
    email: 'user@solana.password.auth',
    password: '123456',
    accessToken: loginResponse.body.accessToken,
    privateKey: solanaKeypair.privateKey,
    walletAddress: solanaKeypair.walletAddress,
  };
};

export const initUsersWithPasswordAuth = async (app) => {
  const userPayload = {
    avatar: 'https://google.com/userA.png',
    email: 'user@password.auth',
    username: 'UserPasswordAuth',
    displayName: 'user password auth',
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

  const loginPayload = {
    username: 'user@password.auth',
    password: '123456',
  };

  const loginResponse = await request(app.getHttpServer())
    .post('/api/auth/login')
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .send(loginPayload);

  expect(loginResponse.statusCode).toEqual(HttpStatus.CREATED);
  expect(loginResponse.body.accessToken).toBeTruthy();

  const profileResponse = await request(app.getHttpServer())
    .get('/api/user/profile')
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
    .send();

  expect(profileResponse.statusCode).toEqual(HttpStatus.OK);
  expect(profileResponse.body.email).toEqual(loginPayload.username);

  return {
    userId: response.body._id,
    email: 'user@password.auth',
    password: '123456',
    accessToken: loginResponse.body.accessToken,
  };
};

export const initUserWithSolanaAuth = async (app, authService) => {
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
    email: 'user@solana.auth',
    username: 'UserSolanaAuth',
    displayName: 'user solana auth',
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
  const signedLoginData = sign.detached(encodedLoginMessage, keypair.secretKey);
  const encodedLoginSignedMessage = bs.encode(signedLoginData);

  // Now to login
  const userPayload = {
    username: 'user@solana.auth',
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
    .get('/api/user/profile')
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${accessToken}`)
    .send();

  expect(profileResponse.statusCode).toEqual(HttpStatus.OK);
  expect(profileResponse.body.email).toEqual(userPayload.username);

  return {
    userId: profileResponse.body._id,
    email: 'user@solana.auth',
    privateKey: bs.encode(keypair.secretKey),
    walletAddress: keypair.publicKey.toBase58(),
    accessToken,
  };
};

export const initUserWithEVMAuth = async (app, authService) => {
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
    email: 'user@evm.auth',
    username: 'UserEvmAuth',
    displayName: 'user evm auth',
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
    username: 'user@evm.auth',
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
    .get('/api/user/profile')
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${accessToken}`)
    .send();

  expect(profileResponse.statusCode).toEqual(HttpStatus.OK);
  expect(profileResponse.body.email).toEqual(userPayload.username);

  return {
    userId: profileResponse.body._id,
    email: 'user@evm.auth',
    privateKey: account.privateKey,
    walletAddress: account.address,
    accessToken,
  };
};
