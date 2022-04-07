import { User, UserRole } from '../entities/user.entity';
import {
  ArrayUnique,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateUserDto implements User {
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

  @IsBoolean()
  isEmailVerified: boolean;

  @IsBoolean()
  isEnabled: boolean;

  @IsEnum(UserRole, { each: true })
  @ArrayUnique()
  roles: string[];

  @IsString()
  @MaxLength(32)
  username: string;
}
