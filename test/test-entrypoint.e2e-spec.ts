import { TestHelper } from './test.helper';

export const testHelper = new TestHelper();

beforeAll(async () => {
  jest.useFakeTimers('legacy'); // use this to void errors on CI servers
  await testHelper.bootTestingApp();
});

afterAll(async () => {
  await testHelper.shutDownTestingApp();
});

require('./registration.e2e-spec');
require('./connect-wallet.e2e-spec');
require('./profile.e2e-specs');
