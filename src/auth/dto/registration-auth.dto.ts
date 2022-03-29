import { AuthType } from '../entities/auth.entity';
import { PasswordCredentialAuthDto } from './password-credential-auth.dto';
import { WalletCredentialAuthDto } from './wallet-credential-auth.dto';

class RegistrationDto {
  avatar: string;
  displayName: string;
  email: string;
  username: string;
  type: AuthType;
  credential: WalletCredentialAuthDto | PasswordCredentialAuthDto;
}

export class RegistrationAuthDto extends RegistrationDto {}
