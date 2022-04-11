import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  SetMetadata,
  Request,
  Put,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';

import { UserService } from './user.service';
import { RestrictJwtSessionGuard } from '../auth/restrict-jwt-session.guard';
import { SessionType } from '../auth/entities/auth-session.entity';
import { UpdateProfileAuthDto } from './dto/profile-user.dto';
import { FastifyFilesInterceptor, imageFileFilter } from '../file.interceptor';

@ApiBearerAuth('Bearer')
@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/validate/username/:query')
  validateUsername(@Param('query') query: string) {
    return this.userService.validateEmailOrUsername(query);
  }

  @Post('/validate/wallet-address/:query')
  validateWalletAddress(@Param('query') query: string) {
    return this.userService.validateWallet(query);
  }

  @UseGuards(AuthGuard('jwt'), RestrictJwtSessionGuard)
  @SetMetadata('sessionType', [SessionType.Auth])
  @Get('/profile')
  getUserProfile(@Request() req) {
    const session = req.user;
    return session.user;
  }

  @UseGuards(AuthGuard('jwt'), RestrictJwtSessionGuard)
  @SetMetadata('sessionType', [SessionType.Auth])
  @Put('/profile')
  updateUserProfile(
    @Body() updateProfileDto: UpdateProfileAuthDto,
    @Request() req,
  ) {
    const session = req.user;
    return this.userService.updateProfile(session.user.id, updateProfileDto);
  }

  @ApiConsumes('multipart/form-data')
  @UseGuards(AuthGuard('jwt'), RestrictJwtSessionGuard)
  @SetMetadata('sessionType', [SessionType.Auth])
  @Post('/profile/upload-image')
  @UseInterceptors(
    FastifyFilesInterceptor('files', 1, {
      fileFilter: imageFileFilter,
    }),
  )
  async upload(@UploadedFiles() files: Express.Multer.File[], @Request() req) {
    const session = req.user;
    return this.userService.uploadFile(session.user.id, files[0]);
  }

  @UseGuards(AuthGuard('jwt'), RestrictJwtSessionGuard)
  @SetMetadata('sessionType', [SessionType.Auth])
  @Get('/profile/auth-entities')
  getUserAuthEntities(@Request() req) {
    const session = req.user;
    return this.userService.getUserAuthEntities(session.user.id);
  }

  @UseGuards(AuthGuard('jwt'), RestrictJwtSessionGuard)
  @SetMetadata('sessionType', [SessionType.Auth])
  @Delete('/profile/auth-entities/:auth_id')
  @HttpCode(204)
  deleteUserAuthEntity(@Param('auth_id') id: string, @Request() req) {
    const session = req.user;
    return this.userService.deleteUserAuthEntity(session.user.id, id);
  }

  @UseGuards(AuthGuard('jwt'), RestrictJwtSessionGuard)
  @SetMetadata('sessionType', [SessionType.Auth])
  @Post('/profile/auth-entities/:auth_id/make-primary')
  setPrimaryAuthEntity(@Param('auth_id') auth_id: string, @Request() req) {
    const session = req.user;
    return this.userService.setPrimaryAuthEntity(session.user.id, auth_id);
  }
}
