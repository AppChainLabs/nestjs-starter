import { Test, TestingModule } from '@nestjs/testing';
import { Jwt } from './jwt';
import { ConfigService } from '@nestjs/config';

describe('Jwt', () => {
  let provider: Jwt;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Jwt, ConfigService],
    }).compile();

    provider = module.get<Jwt>(Jwt);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
