import { IsString } from 'class-validator';

export class LoginAuthDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}
