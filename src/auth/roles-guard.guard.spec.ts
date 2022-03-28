import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles-guard.guard';

describe('RolesGuardGuard', () => {
  it('should be defined', () => {
    expect(new RolesGuard(new Reflector())).toBeDefined();
  });
});
