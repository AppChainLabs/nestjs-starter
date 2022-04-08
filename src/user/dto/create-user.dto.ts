import { User, UserRole } from '../entities/user.entity';
import {
  ArrayUnique,
  IsAlphanumeric,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateUserDto implements User {
  @IsOptional()
  @IsUrl({
    require_protocol: true,
    require_valid_protocol: true,
  })
  avatar: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  displayName: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsBoolean()
  isEmailVerified: boolean;

  @IsBoolean()
  isEnabled: boolean;

  @IsEnum(UserRole, { each: true })
  @ArrayUnique()
  roles: string[];

  @IsOptional()
  @IsAlphanumeric()
  @MaxLength(32)
  username: string;
}
