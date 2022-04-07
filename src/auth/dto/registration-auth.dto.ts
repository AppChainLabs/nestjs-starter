import {
  IsEmail,
  IsEnum,
  IsString,
  IsUrl, MaxLength,
  ValidateNested,
} from 'class-validator';
import { AuthType } from '../entities/auth.entity';
import { PasswordCredentialAuthDto } from './password-credential-auth.dto';
import { WalletCredentialAuthDto } from './wallet-credential-auth.dto';

class RegistrationDto {
  @IsUrl({
    require_protocol: true,
    require_valid_protocol: true,
  })
  avatar: string;

  @IsString()
  @MaxLength(32)
  displayName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MaxLength(32)
  username: string;

  @IsEnum(AuthType)
  type: AuthType;

  @ValidateNested()
  credential: WalletCredentialAuthDto | PasswordCredentialAuthDto;
}

export class RegistrationAuthDto extends RegistrationDto {}
