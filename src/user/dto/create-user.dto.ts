import { User, UserRole } from '../entities/user.entity';
import {
  ArrayUnique,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreateUserDto implements User {
  @IsUrl()
  avatar: string;

  @IsString()
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
  username: string;
}
