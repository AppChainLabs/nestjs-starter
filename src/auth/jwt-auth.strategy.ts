import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Jwt } from '../providers/jwt';
import { JwtPayload } from './dto/jwt-auth.dto';
import { AuthService } from './auth.service';
import { HashingAlgorithm } from './entities/auth.entity';
import { UserService } from '../user/user.service';
import { HashingService } from '../providers/hashing';
import {
  AuthSessionDocument,
  SessionType,
} from './entities/auth-session.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private jwtOptions: Jwt,
    private hashingService: HashingService,
    private userService: UserService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtOptions.getKeyPair().publicKey,
      algorithms: jwtOptions.getVerifyOptions().algorithms,
    });
  }

  private async validateUserWithJwtCredential(jwtPayload: JwtPayload) {
    const user = await this.userService.findById(jwtPayload.signedData.uid);
    if (!user) throw new UnauthorizedException();

    const session = (await this.authService.findAuthSessionById(
      jwtPayload.sid,
    )) as AuthSessionDocument;
    if (!session) throw new UnauthorizedException();

    if (session.sessionType !== SessionType.ResetCredential) {
      const authEntity = await this.authService.findAuthEntityById(
        session.authId,
      );
      if (!authEntity) throw new UnauthorizedException();
    }

    if (new Date().getTime() >= new Date(session.expiresAt).getTime()) {
      throw new UnauthorizedException();
    }

    if (session.userId.toString() !== user.id.toString()) {
      throw new UnauthorizedException();
    }

    const isChecksumVerified = await this.hashingService
      .getHasher(HashingAlgorithm.BCrypt)
      .compare(
        JSON.stringify({ signedData: jwtPayload.signedData }),
        session.checksum,
      );

    if (!isChecksumVerified) throw new UnauthorizedException();

    return { session, user };
  }

  async validate(payload: JwtPayload) {
    return this.validateUserWithJwtCredential(payload);
  }
}
