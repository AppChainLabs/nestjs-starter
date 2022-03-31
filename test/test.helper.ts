import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import mongoose from 'mongoose';

import { closeInMongodConnection } from '../src/helper';
import { AppModule } from '../src/app.module';
import { globalApply } from '../src/main';
import { initUserFixtures } from './users.fixtures';

export class TestHelper {
  public app: INestApplication;
  public moduleFixture: TestingModule;

  public async beforeAll() {
    this.moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = this.moduleFixture.createNestApplication();
    globalApply(this.app);

    await this.app.init();

    // import fixtures
    await this.applyFixtures();
  }

  public async afterAll() {
    await mongoose.connection.close();
    await closeInMongodConnection();
    await this.moduleFixture.close();
    await this.app.close();
  }

  private async applyFixtures() {
    await initUserFixtures(this.app);
  }
}
