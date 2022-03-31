import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
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
  WalletCredential,
} from './entities/auth.entity';
import { WalletCredentialAuthDto } from './dto/wallet-credential-auth.dto';
import { UserService } from '../user/user.service';

const WalletAuthStrategyKey = 'custom';

@Injectable()
export class WalletAuthStrategy extends PassportStrategy(
  Strategy,
  WalletAuthStrategyKey,
) {
  static key = WalletAuthStrategyKey;

  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {
    super();
  }

  private async validateUserWithWalletCredential(
    query: string,
    authType: AuthType,
    walletCredentialDto: WalletCredentialAuthDto,
  ) {
    const user = await this.userService.findByEmailOrUsername(query);
    if (!user) throw new UnauthorizedException();

    const authEntity = (await this.authService.findAuthEntityWithUserId(
      authType,
      user.id,
    )) as AuthDocument;

    if (
      !this.authService.verifyWalletSignature(
        authType,
        walletCredentialDto,
        authEntity.credential as WalletCredential,
      )
    )
      throw new UnauthorizedException();

    return { authEntity: authEntity, user };
  }

  async validate(
    @Req() req: Request,
  ): Promise<{ authEntity: AuthDocument; user: UserDocument }> {
    const { username, authType, walletCredentialDto } = req.body as unknown as {
      username: string;
      authType: AuthType;
      walletCredentialDto: WalletCredentialAuthDto;
    };

    return this.validateUserWithWalletCredential(
      username,
      authType,
      walletCredentialDto,
    );
  }
}
