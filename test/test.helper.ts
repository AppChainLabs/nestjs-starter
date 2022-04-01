import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import mongoose from 'mongoose';

import { closeInMongodConnection } from '../src/helper';
import { AppModule } from '../src/app.module';
import { globalApply } from '../src/main';
import {
  initUsersWithPasswordAuth,
  initUserWithEVMAuth,
  initUserWithSolanaAuth,
} from './users.fixtures';
import { AuthService } from '../src/auth/auth.service';

export class TestHelper {
  public app: INestApplication;
  public moduleFixture: TestingModule;

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
    await mongoose.connection.close();
    await closeInMongodConnection();
    await this.moduleFixture.close();
    await this.app.close();
  }

  public getModule<Module>(moduleClass) {
    return this.moduleFixture.get<Module>(moduleClass);
  }

  private async applyFixtures() {
    await initUsersWithPasswordAuth(this.app);
    await initUserWithEVMAuth(
      this.app,
      this.getModule<AuthService>(AuthService),
    );
    await initUserWithSolanaAuth(
      this.app,
      this.getModule<AuthService>(AuthService),
    );
  }
}
