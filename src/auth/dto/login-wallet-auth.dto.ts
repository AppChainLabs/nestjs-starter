import { AuthType } from '../entities/auth.entity';
import { WalletCredentialDto } from './wallet-credential-dto';

export class LoginWalletAuthDto {
  username: string;
  authType: AuthType;
  walletCredentialDto: WalletCredentialDto;
}
