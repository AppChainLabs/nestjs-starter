import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Param,
  Post,
  Request,
  SetMetadata,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { RegistrationAuthDto } from './dto/registration-auth.dto';
import { LoginWalletAuthDto } from './dto/login-wallet-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { WalletAuthStrategy } from './wallet-auth.strategy';
import { PasswordAuthStrategy } from './password-auth.strategy';
import { UserDocument, UserRole } from '../user/entities/user.entity';
import { RestrictJwtSessionGuard } from './restrict-jwt-session.guard';
import { SessionType } from './entities/auth-session.entity';
import { AuthType } from './entities/auth.entity';
import { ConnectEmailAuthDto } from './dto/connect-email-auth.dto';
import { RolesGuard } from './roles-guard.guard';
import { AdminLoginDto } from '../admin/dto/admin-login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard(PasswordAuthStrategy.key), RolesGuard)
  @SetMetadata('roles', [UserRole.SystemAdmin])
  @Post('login-admin/')
  async adminLogin(@Body() adminLoginDto: AdminLoginDto, @Request() req) {
    const session = req.user;

    await this.authService.verifyEmailOtp(
      session.user.email,
      adminLoginDto.token,
    );

    return this.authService.generateAccessToken('auth-admin', session);
  }

  @UseGuards(AuthGuard(PasswordAuthStrategy.key))
  @Post('/login')
  async login(@Body() loginDto: LoginAuthDto, @Request() req) {
    const session = req.user;

    if (session.user.roles.find((role) => role === UserRole.SystemAdmin)) {
      throw new UnauthorizedException(); // Prevent admin to login with normal endpoint
    }

    const audience = req.headers.host;
    return this.authService.generateAccessToken(audience, session);
  }

  @UseGuards(AuthGuard(WalletAuthStrategy.key))
  @Post('/login-wallet')
  async loginWallet(
    @Body() loginWalletDto: LoginWalletAuthDto,
    @Request() req,
  ) {
    const session = req.user;

    if (session.user.roles.find((role) => role === UserRole.SystemAdmin)) {
      throw new UnauthorizedException(); // Prevent admin to login with normal endpoint
    }

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
  @Post('/connect-wallet')
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

  @Post('/send-email-verification/:email')
  sendEmailVerification(@Param('email') email: string) {
    return this.authService.sendEmailVerification(email);
  }

  @ApiBearerAuth('Bearer')
  @UseGuards(AuthGuard('jwt'), RestrictJwtSessionGuard)
  @SetMetadata('sessionType', [SessionType.Auth])
  @Post('/connect-email')
  connectEmail(
    @Body() connectEmailAuthDto: ConnectEmailAuthDto,
    @Request() req,
  ) {
    const session = req.user;
    return this.authService.connectEmail(session.user._id, connectEmailAuthDto);
  }
}
