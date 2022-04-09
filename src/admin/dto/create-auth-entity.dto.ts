import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AuthType } from '../../auth/entities/auth.entity';

export class AdminWalletCredentialDto {
  @IsString()
  walletAddress: string;
}

export class AdminPasswordCredentialDto {
  @IsString()
  password: string;
}

export class AdminCreateAuthEntityDto {
  @ValidateNested()
  @IsObject()
  credential: AdminWalletCredentialDto | AdminPasswordCredentialDto;

  @IsEnum(AuthType)
  type: AuthType;

  @IsString()
  userId: string;

  @IsBoolean()
  isPrimary: boolean;
}
