import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Request,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { RegistrationAuthDto } from './dto/registration-auth.dto';
import { LoginWalletAuthDto } from './dto/login-wallet-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { WalletAuthStrategy } from './wallet-auth.strategy';
import { PasswordAuthStrategy } from './password-auth.strategy';
import { UserDocument } from '../user/entities/user.entity';
import { RestrictJwtSessionGuard } from './restrict-jwt-session.guard';
import { SessionType } from './entities/auth-session.entity';
import { AuthType } from './entities/auth.entity';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard(PasswordAuthStrategy.key))
  @Post('login')
  async login(@Body() loginDto: LoginAuthDto, @Request() req) {
    const session = req.user;
    const audience = req.headers.host;
    return this.authService.generateAccessToken(audience, session);
  }

  @UseGuards(AuthGuard(WalletAuthStrategy.key))
  @Post('login-wallet')
  async loginWallet(
    @Body() loginWalletDto: LoginWalletAuthDto,
    @Request() req,
  ) {
    const session = req.user;
    const audience = req.headers.host;
    return this.authService.generateAccessToken(audience, session);
  }

  @Post('/sign-up')
  register(@Body() registrationDto: RegistrationAuthDto) {
    return this.authService.signUpUser(registrationDto);
  }

  @Post('/challenge/:target')
  getAuthChallenge(@Param('target') target: string) {
    return this.authService.generateAuthChallenge(target);
  }

  @ApiBearerAuth('Bearer')
  @UseGuards(AuthGuard('jwt'), RestrictJwtSessionGuard)
  @SetMetadata('sessionType', [SessionType.Auth])
  @Get('/profile')
  getProfile(@Request() req) {
    const session = req.user;
    return session.user;
  }

  @ApiBearerAuth('Bearer')
  @UseGuards(AuthGuard('jwt'), RestrictJwtSessionGuard)
  @SetMetadata('sessionType', [SessionType.Auth])
  @Post('connect-wallet')
  connectWallet(@Body() createAuthDto: CreateAuthDto, @Request() req) {
    const session = req.user;

    const { user } = session as unknown as { user: UserDocument };

    if (user.id.toString() !== createAuthDto.userId) {
      throw new ForbiddenException();
    }

    if (createAuthDto.type === AuthType.Password) {
      throw new BadRequestException();
    }

    return this.authService.createAuthEntity(createAuthDto);
  }

  @ApiBearerAuth('Bearer')
  @UseGuards(AuthGuard('jwt'), RestrictJwtSessionGuard)
  @SetMetadata('sessionType', [SessionType.Auth])
  @Delete(':user_id/:auth_id')
  deleteEntity(
    @Param('auth_id') id: string,
    @Param('user_id') user_id: string,
    @Request() req,
  ) {
    const session = req.user;

    const { user } = session as unknown as { user: UserDocument };

    if (user.id.toString() !== user_id) {
      throw new ForbiddenException();
    }
    return this.authService.deleteAuthEntity(id);
  }
}
