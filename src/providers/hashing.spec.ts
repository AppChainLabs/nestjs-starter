import { Test, TestingModule } from '@nestjs/testing';
import { HashingService } from './hashing';

describe('HashingService', () => {
  let provider: HashingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HashingService],
    }).compile();

    provider = module.get<HashingService>(HashingService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
