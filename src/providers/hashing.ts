import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { HashingAlgorithm } from '../auth/entities/auth.entity';

@Injectable()
export class HashingService {
  getHasher(algorithm: string): BCryptHashing {
    if (algorithm === HashingAlgorithm.BCrypt) return new BCryptHashing();
    return null;
  }
}

class BCryptHashing {
  genSalt: typeof bcrypt.genSalt;
  hash: typeof bcrypt.hash;
  compare: typeof bcrypt.compare;
}
