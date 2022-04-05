import { TestHelper } from './test.helper';

export const testHelper = new TestHelper();

beforeAll(async () => {
  await testHelper.bootTestingApp();
});

afterAll(async () => {
  await testHelper.shutDownTestingApp();
});

require('./registration.e2e-spec');
require('./connect-wallet.e2e-spec');
