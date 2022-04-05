import { ConfigService } from '@nestjs/config';
import { TestHelper } from './test.helper';

export const testHelper = new TestHelper(new ConfigService());

beforeAll(async () => {
  await testHelper.bootTestingApp();
});

afterAll(async () => {
  await testHelper.shutDownTestingApp();
});

require('./auth.e2e-spec');
require('./connect-wallet.e2e-spec');
