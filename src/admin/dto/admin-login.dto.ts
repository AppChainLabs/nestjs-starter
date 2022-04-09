import { IsNumberString, MaxLength } from 'class-validator';
import { LoginAuthDto } from '../../auth/dto/login-auth.dto';

export class AdminLoginDto extends LoginAuthDto {
  @IsNumberString()
  @MaxLength(6)
  token: string;
}
