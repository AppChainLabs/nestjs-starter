import {
  AuthType,
  PasswordCredential,
  WalletCredential,
} from '../entities/auth.entity';

class RegistrationDto {
  avatar: string;
  displayName: string;
  email: string;
  username: string;
  type: AuthType;
  credentials: WalletCredential | PasswordCredential;
}

export class RegistrationAuthDto extends RegistrationDto {}
