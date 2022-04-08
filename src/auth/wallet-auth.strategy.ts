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
    authType: AuthType,
    credential: WalletCredentialAuthDto,
  ) {
    const authEntity = (await this.authService.findWalletAuthEntity(
      credential.walletAddress,
    )) as AuthDocument;

    const user = await this.userService.findById(authEntity.userId);
    if (!user) throw new UnauthorizedException();

    const isCredentialVerified = await this.authService.verifyWalletSignature(
      authType,
      credential,
      authEntity.credential as WalletCredential,
    );

    if (!isCredentialVerified) throw new UnauthorizedException();

    return { authEntity, user };
  }

  async validate(
    @Req() req: Request,
  ): Promise<{ authEntity: AuthDocument; user: UserDocument }> {
    const { authType, credential } = req.body as unknown as {
      authType: AuthType;
      credential: WalletCredentialAuthDto;
    };

    return this.validateUserWithWalletCredential(authType, credential);
  }
}
