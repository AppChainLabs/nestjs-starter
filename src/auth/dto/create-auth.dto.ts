import { AuthType } from '../entities/auth.entity';
import { PasswordCredentialAuthDto } from './password-credential-auth.dto';
import { WalletCredentialAuthDto } from './wallet-credential-auth.dto';

export class CreateAuthDto {
  credential: WalletCredentialAuthDto | PasswordCredentialAuthDto;
  type: AuthType;
  userId: string;
}
