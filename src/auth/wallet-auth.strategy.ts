import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import {
  Injectable,
  Req,
  UnauthorizedException,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserDocument } from '../user/entities/user.entity';
import { AuthType } from './entities/auth.entity';
import { WalletCredentialAuthDto } from './dto/wallet-credential-auth.dto';

const WalletAuthStrategyKey = 'custom';

@Injectable()
export class WalletAuthStrategy extends PassportStrategy(
  Strategy,
  WalletAuthStrategyKey,
) {
  static key = WalletAuthStrategyKey;

  constructor(private authService: AuthService) {
    super();
  }

  async validate(@Req() req: Request): Promise<UserDocument> {
    const { username, authType, walletCredentialDto } = req.body as unknown as {
      username: string;
      authType: AuthType;
      walletCredentialDto: WalletCredentialAuthDto;
    };

    const user = await this.authService.validateUserWithWalletCredential(
      username,
      authType,
      walletCredentialDto,
    );
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
