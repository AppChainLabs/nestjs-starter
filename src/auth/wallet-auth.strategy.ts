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
import { AuthType, WalletCredential } from './entities/auth.entity';
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

    const { id, credential } = (await this.authService.findAuthEntityWithUserId(
      authType,
      user.id,
    )) as { id: string; credential: WalletCredential };

    if (
      !this.authService.verifyWalletSignature(
        authType,
        walletCredentialDto,
        credential,
      )
    )
      throw new UnauthorizedException();

    return { authId: id, user };
  }

  async validate(
    @Req() req: Request,
  ): Promise<{ authId: string; user: UserDocument }> {
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
