import { AuthType } from '../entities/auth.entity';
import { WalletCredentialAuthDto } from './wallet-credential-auth.dto';

export class LoginWalletAuthDto {
  username: string;
  authType: AuthType;
  walletCredentialDto: WalletCredentialAuthDto;
}
