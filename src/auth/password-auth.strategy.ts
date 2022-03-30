import { Strategy } from 'passport-custom';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Request, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserDocument } from '../user/entities/user.entity';

const PasswordAuthStrategyKey = 'password-auth';

@Injectable()
export class PasswordAuthStrategy extends PassportStrategy(
  Strategy,
  PasswordAuthStrategyKey,
) {
  static key = PasswordAuthStrategyKey;

  constructor(private authService: AuthService) {
    super();
  }

  async validate(
    @Req() req: Request,
  ): Promise<{ authId: string; user: UserDocument }> {
    const { username, password } = req.body as unknown as {
      username: string;
      password: string;
    };

    return this.authService.validateUserWithPasswordCredential(
      username,
      password,
    );
  }
}
