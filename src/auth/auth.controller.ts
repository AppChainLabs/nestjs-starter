import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { RegistrationAuthDto } from './dto/registration-auth.dto';
import { PasswordAuthStrategy } from './password-auth.strategy';
import { LoginWalletAuthDto } from './dto/login-wallet-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(PasswordAuthStrategy)
  @Post('login')
  async login(@Body() loginDto: LoginAuthDto, @Request() req) {
    return req.user;
  }

  @UseGuards(PasswordAuthStrategy)
  @Post('login-wallet')
  async loginWallet(
    @Body() loginWalletDto: LoginWalletAuthDto,
    @Request() req,
  ) {
    return req.user;
  }

  @Post('/sign-up')
  register(@Body() registrationDto: RegistrationAuthDto) {
    return this.authService.signUpUser(registrationDto);
  }

  @Post('/connect-wallet')
  connectWallet(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.createAuthEntity(createAuthDto);
  }

  @Delete(':auth_id')
  deleteEntity(@Param('auth_id') id: string) {
    return this.authService.deleteAuthEntity(id);
  }
}
