import { TestHelper } from './test.helper';

export const testHelper = new TestHelper();

jest.setTimeout(30000);

beforeAll(async () => {
  await testHelper.bootTestingApp();
});

afterAll(async () => {
  await testHelper.shutDownTestingApp();
});

require('./auth.e2e-spec');
require('./registration.e2e-spec');
require('./connect-wallet.e2e-spec');
require('./profile.e2e-specs');
require('./admin.e2e-spec');
