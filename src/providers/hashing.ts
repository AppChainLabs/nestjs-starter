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
  genSalt: typeof bcrypt.genSalt = bcrypt.genSalt;

  async hash(data: any) {
    const salt = await this.genSalt();
    return bcrypt.hash(data, salt);
  }

  compare: typeof bcrypt.compare = bcrypt.compare;
}
