import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Jwt } from '../providers/jwt';
import { JwtPayload } from './dto/jwt-auth.dto';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private jwtOptions: Jwt, private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtOptions.getKeyPair().publicKey,
      algorithms: jwtOptions.getVerifyOptions().algorithms,
    });
  }

  async validate(payload: JwtPayload) {
    return this.authService.validateUserWithJwtCredential(payload);
  }
}
