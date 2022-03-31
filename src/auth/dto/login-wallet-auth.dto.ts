import { IsEnum, IsString, ValidateNested } from 'class-validator';
import { AuthType } from '../entities/auth.entity';
import { WalletCredentialAuthDto } from './wallet-credential-auth.dto';

export class LoginWalletAuthDto {
  @IsString()
  username: string;

  @IsEnum(AuthType)
  authType: AuthType;

  @ValidateNested()
  walletCredentialDto: WalletCredentialAuthDto;
}
