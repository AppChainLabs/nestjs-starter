import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Optional,
  SetMetadata,
  Request,
  Put,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RolesGuard } from '../auth/roles-guard.guard';
import { UserRole } from './entities/user.entity';
import { RestrictJwtSessionGuard } from '../auth/restrict-jwt-session.guard';
import { SessionType } from '../auth/entities/auth-session.entity';
import { UpdateProfileAuthDto } from './dto/profile-user.dto';

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
    return this.userService.updateProfile(session.user._id, updateProfileDto);
  }

  @UseGuards(AuthGuard('jwt'), RestrictJwtSessionGuard)
  @SetMetadata('sessionType', [SessionType.Auth])
  @Get('/profile/auth-entities')
  getUserAuthEntities(@Request() req) {
    const session = req.user;
    return this.userService.getUserAuthEntities(session.user._id);
  }

  @UseGuards(AuthGuard('jwt'), RestrictJwtSessionGuard)
  @SetMetadata('sessionType', [SessionType.Auth])
  @SetMetadata('roles', [UserRole.SystemAdmin])
  @Delete('/profile/auth-entities/:auth_id')
  deleteUserAuthEntity(@Param('auth_id') id: string, @Request() req) {
    const session = req.user;
    return this.userService.deleteUserAuthEntity(session.user._id, id);
  }

  @UseGuards(AuthGuard('jwt'), RestrictJwtSessionGuard)
  @SetMetadata('sessionType', [SessionType.Auth])
  @Post('/profile/auth-entities/:auth_id/make-primary')
  setPrimaryAuthEntity(@Param('auth_id') auth_id: string, @Request() req) {
    const session = req.user;
    return this.userService.setPrimaryAuthEntity(session.user._id, auth_id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, RestrictJwtSessionGuard)
  @SetMetadata('sessionType', [SessionType.Auth])
  @SetMetadata('roles', [UserRole.SystemAdmin])
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, RestrictJwtSessionGuard)
  @SetMetadata('sessionType', [SessionType.Auth])
  @SetMetadata('roles', [UserRole.SystemAdmin])
  @Get()
  findAll(
    @Query('searchQuery') searchQuery: string,
    @Query('limit') limit: number,
    @Query('skip') skip: number,
    @Optional() @Query('sort') sort = '-createdAt',
  ) {
    return this.userService.findAll(searchQuery, limit, skip, sort);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, RestrictJwtSessionGuard)
  @SetMetadata('sessionType', [SessionType.Auth])
  @SetMetadata('roles', [UserRole.SystemAdmin])
  @Get(':user_id')
  findOne(@Param('user_id') id: string) {
    return this.userService.findById(id);
  }

  @UseGuards(AuthGuard('jwt'), RestrictJwtSessionGuard)
  @SetMetadata('sessionType', [SessionType.Auth])
  @SetMetadata('roles', [UserRole.SystemAdmin])
  @Get(':user_id/auth-entities')
  getAuthEntities(@Param('user_id') user_id: string) {
    return this.userService.getUserAuthEntities(user_id);
  }

  @UseGuards(AuthGuard('jwt'), RestrictJwtSessionGuard)
  @SetMetadata('sessionType', [SessionType.Auth])
  @Delete(':user_id/auth-entities/:auth_id')
  deleteAuthEntity(
    @Param('auth_id') id: string,
    @Param('user_id') user_id: string,
  ) {
    return this.userService.deleteUserAuthEntity(user_id, id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, RestrictJwtSessionGuard)
  @SetMetadata('sessionType', [SessionType.Auth])
  @SetMetadata('roles', [UserRole.SystemAdmin])
  @Patch(':user_id')
  update(@Param('user_id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, RestrictJwtSessionGuard)
  @SetMetadata('sessionType', [SessionType.Auth])
  @SetMetadata('roles', [UserRole.SystemAdmin])
  @Delete(':user_id')
  remove(@Param('user_id') id: string) {
    return this.userService.remove(id);
  }
}
