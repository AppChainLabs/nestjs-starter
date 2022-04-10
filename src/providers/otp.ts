import { Injectable } from '@nestjs/common';
import { totp } from 'otplib';

@Injectable()
export class Otp {
  constructor() {
    totp.options = {
      ...totp.options,
      step: 60, // token expires in 60s
    };
  }
  generateToken(secret: string) {
    return totp.generate(secret);
  }

  verify(token: string, secret: string) {
    return totp.verify({ token, secret });
  }
}
