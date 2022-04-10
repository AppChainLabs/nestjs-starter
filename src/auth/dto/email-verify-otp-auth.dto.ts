import { IsEmail, IsNumberString, IsUrl, MaxLength } from 'class-validator';

export class EmailVerifyOtpAuthDto {
  @IsNumberString()
  @MaxLength(6)
  token: string;
}

export class ConnectWalletViaEmailDto {
  @IsUrl({
    require_protocol: true,
    require_valid_protocol: true,
  })
  connectWalletLink: string;

  @IsEmail()
  email: string;
}
