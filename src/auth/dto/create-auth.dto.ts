import { AuthType } from '../entities/auth.entity';
import { PasswordCredentialAuthDto } from './password-credential-auth.dto';
import { WalletCredentialAuthDto } from './wallet-credential-auth.dto';
import { IsEnum, ValidateNested } from 'class-validator';

export class CreateAuthDto {
  @ValidateNested()
  credential: WalletCredentialAuthDto | PasswordCredentialAuthDto;

  @IsEnum(AuthType)
  type: AuthType;
}
