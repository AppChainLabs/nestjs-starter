import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { RegistrationAuthDto } from './dto/registration-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/sign-up')
  register(@Body() registrationDto: RegistrationAuthDto) {
    return this.authService.signUpUser(registrationDto);
  }

  @Post('/connect-wallet')
  connectWallet(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.createAuthEntity(createAuthDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.deleteAuthEntity(id);
  }
}
