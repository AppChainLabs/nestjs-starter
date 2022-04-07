import {
  IsAlphanumeric,
  IsBoolean,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';

class ProfileAuthDto {
  @IsUrl({
    require_protocol: true,
    require_valid_protocol: true,
  })
  avatar: string;

  @IsAlphanumeric()
  @MaxLength(32)
  username: string;

  @IsBoolean()
  removeEmail: boolean;

  @IsString()
  @MaxLength(32)
  displayName: string;
}

export class UpdateProfileAuthDto extends PartialType(ProfileAuthDto) {}
