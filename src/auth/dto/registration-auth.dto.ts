import { PartialType } from '@nestjs/swagger';
import {
  AuthType,
  PasswordCredential,
  WalletCredential,
} from '../entities/auth.entity';

class RegistrationDto {
  avatar: string;
  credentials: WalletCredential | PasswordCredential;
  displayName: string;
  email: string;
  isEmailVerified: boolean;
  isEnabled: boolean;
  role: string[];
  type: AuthType;
  username: string;
}

export class RegistrationAuthDto extends PartialType(RegistrationDto) {}
