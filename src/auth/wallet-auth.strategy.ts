import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserDocument } from '../user/entities/user.entity';
import { AuthType } from './entities/auth.entity';
import { WalletCredentialDto } from './dto/wallet-credential-dto';

@Injectable()
export class WalletAuthStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(
    username: string,
    authType: AuthType,
    walletCredentialDto: WalletCredentialDto,
  ): Promise<UserDocument> {
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
