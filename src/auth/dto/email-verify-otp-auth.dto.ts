import { IsNumberString, MaxLength } from 'class-validator';

export class EmailVerifyOtpAuthDto {
  @IsNumberString()
  @MaxLength(6)
  token: string;
}
