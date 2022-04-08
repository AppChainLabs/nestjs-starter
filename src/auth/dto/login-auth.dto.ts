import { IsString, MaxLength } from 'class-validator';

export class LoginAuthDto {
  @IsString()
  @MaxLength(32)
  username: string;

  @IsString()
  password: string;
}
