import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Get,
  ForbiddenException,
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
import { JwtAuthGuard } from './jwt-guard.guard';
import { UserDocument } from '../user/entities/user.entity';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard(PasswordAuthStrategy.key))
  @Post('login')
  async login(@Body() loginDto: LoginAuthDto, @Request() req) {
    const user = req.user;
    const audience = req.headers.host;
    return this.authService.generateAccessToken(audience, user);
  }

  @UseGuards(AuthGuard(WalletAuthStrategy.key))
  @Post('login-wallet')
  async loginWallet(
    @Body() loginWalletDto: LoginWalletAuthDto,
    @Request() req,
  ) {
    const user = req.user;
    const audience = req.headers.host;
    return this.authService.generateAccessToken(audience, user);
  }

  @Post('/sign-up')
  register(@Body() registrationDto: RegistrationAuthDto) {
    return this.authService.signUpUser(registrationDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/profile')
  @ApiBearerAuth('Bearer')
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('connect-wallet')
  connectWallet(@Body() createAuthDto: CreateAuthDto, @Request() req: Request) {
    const { user } = req as unknown as { user: UserDocument };

    if (user.id.toString() !== createAuthDto.userId) {
      throw new ForbiddenException();
    }

    return this.authService.createAuthEntity(createAuthDto);
  }

  @Delete(':user_id/:auth_id')
  @UseGuards(JwtAuthGuard)
  deleteEntity(
    @Param('auth_id') id: string,
    @Param('user_id') user_id: string,
    @Request() req: Request,
  ) {
    const { user } = req as unknown as { user: UserDocument };

    if (user.id.toString() !== user_id) {
      throw new ForbiddenException();
    }
    return this.authService.deleteAuthEntity(id);
  }
}
