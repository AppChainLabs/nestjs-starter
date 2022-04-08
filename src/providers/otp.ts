import { Injectable } from '@nestjs/common';
import { totp } from 'otplib';

@Injectable()
export class Otp {
  generateToken(secret: string) {
    return totp.generate(secret);
  }

  verify(token: string, secret: string) {
    return totp.verify({ token, secret });
  }
}
