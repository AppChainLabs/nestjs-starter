import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt } from 'passport-jwt';
import { JwtSignOptions } from '@nestjs/jwt';

@Injectable()
export class Jwt {
  constructor(private configService: ConfigService) {}

  getKeyPair() {
    return {
      privateKey: this.configService.get<string>('PRIVATE_KEY'),
      publicKey: this.configService.get<string>('PUBLIC_KEY'),
    };
  }

  getVerifyOptions() {
    return {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      publicKey: this.getKeyPair().publicKey,
      algorithms: ['RS256'],
    };
  }

  getSignInOptions(forAudience = ''): JwtSignOptions {
    return {
      audience:
        forAudience || this.configService.get<string>('DEFAULT_AUDIENCE'),
      expiresIn: '24h',
      issuer: this.configService.get<string>('HOST_URI'),
      algorithm: 'RS256',
    };
  }
}
