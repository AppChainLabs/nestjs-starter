import {
  IsAlphanumeric,
  IsBoolean,
  IsString,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';

class ProfileUserDto {
  @IsOptional()
  @IsAlphanumeric()
  @MaxLength(32)
  username: string;

  @IsOptional()
  @IsBoolean()
  removeEmail: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  displayName: string;
}

export class UpdateProfileAuthDto extends PartialType(ProfileUserDto) {}
