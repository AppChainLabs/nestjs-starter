import { Strategy } from 'passport-custom';
import { PassportStrategy } from '@nestjs/passport';
import {
  Injectable,
  Req,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserDocument } from '../user/entities/user.entity';
import {
  AuthDocument,
  AuthType,
  HashingAlgorithm,
  PasswordCredential,
} from './entities/auth.entity';
import { UserService } from '../user/user.service';
import { HashingService } from '../providers/hashing';

const PasswordAuthStrategyKey = 'password-auth';

@Injectable()
export class PasswordAuthStrategy extends PassportStrategy(
  Strategy,
  PasswordAuthStrategyKey,
) {
  static key = PasswordAuthStrategyKey;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private hashingService: HashingService,
  ) {
    super();
  }

  private async validateUserWithPasswordCredential(
    query: string,
    password: string,
  ) {
    const user = await this.userService.findByEmailOrUsername(query);
    if (!user) throw new UnauthorizedException();

    const auth = await this.authService.findAuthEntityWithUserId(
      AuthType.Password,
      user.id,
    );

    const { credential } = auth as {
      id: string;
      credential: PasswordCredential;
    };

    if (credential.algorithm !== HashingAlgorithm.BCrypt)
      throw new UnauthorizedException();

    const hasher = this.hashingService.getHasher(credential.algorithm);

    const isHashValid = await hasher.compare(password, credential.password);
    if (!isHashValid) throw new UnauthorizedException();

    return { authEntity: auth, user };
  }

  async validate(
    @Req() req: Request,
  ): Promise<{ authEntity: AuthDocument; user: UserDocument }> {
    const { username, password } = req.body as unknown as {
      username: string;
      password: string;
    };

    return this.validateUserWithPasswordCredential(username, password);
  }
}
