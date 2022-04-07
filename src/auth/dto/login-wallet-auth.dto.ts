import { IsEnum, IsString, MaxLength, ValidateNested } from 'class-validator';
import { AuthType } from '../entities/auth.entity';
import { WalletCredentialAuthDto } from './wallet-credential-auth.dto';

export class LoginWalletAuthDto {
  @IsString()
  @MaxLength(32)
  username: string;

  @IsEnum(AuthType)
  authType: AuthType;

  @ValidateNested()
  credential: WalletCredentialAuthDto;
}
