import { IsBoolean, IsString, IsUrl, MaxLength } from 'class-validator';

export class ProfileAuthDto {
  @IsUrl({
    require_protocol: true,
    require_valid_protocol: true,
  })
  avatar: string;

  @IsString()
  @MaxLength(32)
  username: string;

  @IsBoolean()
  removeEmail: boolean;
}
