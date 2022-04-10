import { IsEnum, ValidateNested } from 'class-validator';
import { AuthType } from '../entities/auth.entity';
import { WalletCredentialAuthDto } from './wallet-credential-auth.dto';

export class LoginWalletAuthDto {
  @IsEnum(AuthType)
  type: AuthType;

  @ValidateNested()
  credential: WalletCredentialAuthDto;
}
