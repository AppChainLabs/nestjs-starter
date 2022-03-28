import { Test, TestingModule } from '@nestjs/testing';
import { SignatureService } from './signature';

describe('SignatureService', () => {
  let provider: SignatureService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SignatureService],
    }).compile();

    provider = module.get<SignatureService>(SignatureService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
