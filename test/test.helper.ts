import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bs from 'bs58';
import { Keypair } from '@solana/web3.js';
import { sign as solanaSign } from 'tweetnacl';

import { AppModule } from '../src/app.module';
import { globalApply } from '../src/main';
import {
  initUsersWithPasswordAuth,
  initUserWithEVMAuth,
  initUserWithSolanaAuth,
} from './users.fixtures';
import { AuthService } from '../src/auth/auth.service';
import { pause } from '../src/utils';

export class TestHelper {
  public app: INestApplication;
  public moduleFixture: TestingModule;

  public passwordAuthUser: {
    userId: string;
    email: string;
    password: string;
    accessToken: string;
  };

  public solanaAuthUser: {
    userId: string;
    email: string;
    privateKey: string;
    walletAddress: string;
    accessToken: string;
  };

  public evmAuthUser: {
    userId: string;
    email: string;
    privateKey: string;
    walletAddress: string;
    accessToken: string;
  };

  public async bootTestingApp() {
    this.moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = this.moduleFixture.createNestApplication();
    globalApply(this.app);

    await this.app.init();

    // import fixtures
    await this.applyFixtures();
  }

  public async shutDownTestingApp() {
    await this.moduleFixture.close();
    await this.app.close();
  }

  public createSolanaKeypair() {
    const keypair = Keypair.generate();

    const sign = (message: string) => {
      const encodedLoginMessage = new TextEncoder().encode(message);
      const signedLoginData = solanaSign.detached(
        encodedLoginMessage,
        keypair.secretKey,
      );
      return bs.encode(signedLoginData);
    };

    return {
      privateKey: bs.encode(keypair.secretKey),
      walletAddress: keypair.publicKey.toBase58(),
      sign,
    };
  }

  public createEvmKeyPair() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Web3 = require('web3');
    const w3 = new Web3();
    const account = w3.eth.accounts.create();

    const sign = (message: string) => {
      return account.sign(message).signature;
    };

    return {
      sign,
      privateKey: account.privateKey,
      walletAddress: account.address,
    };
  }

  public getModule<Module>(moduleClass) {
    return this.moduleFixture.get<Module>(moduleClass);
  }

  private async applyFixtures() {
    this.passwordAuthUser = await initUsersWithPasswordAuth(this.app);
    await pause(0.5);
    this.evmAuthUser = await initUserWithEVMAuth(
      this.app,
      this.getModule<AuthService>(AuthService),
    );
    await pause(0.5);
    this.solanaAuthUser = await initUserWithSolanaAuth(
      this.app,
      this.getModule<AuthService>(AuthService),
    );
  }
}
