import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  SetMetadata,
  Query,
  Optional,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles-guard.guard';
import { RestrictJwtSessionGuard } from '../auth/restrict-jwt-session.guard';
import { SessionType } from '../auth/entities/auth-session.entity';
import { UserRole } from '../user/entities/user.entity';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UpdateUserDto } from '../user/dto/update-user.dto';
import { UserService } from '../user/user.service';
import { AdminCreateAuthEntityDto } from './dto/create-auth-entity.dto';

@ApiBearerAuth('Bearer')
@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly userService: UserService,
  ) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard, RestrictJwtSessionGuard)
  @SetMetadata('sessionType', [SessionType.Auth])
  @SetMetadata('roles', [UserRole.SystemAdmin])
  @Post('user/')
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, RestrictJwtSessionGuard)
  @SetMetadata('sessionType', [SessionType.Auth])
  @SetMetadata('roles', [UserRole.SystemAdmin])
  @Get('user/')
  findAll(
    @Query('query') searchQuery: string,
    @Query('limit') limit: number,
    @Query('skip') skip: number,
    @Optional() @Query('sort') sort = '-createdAt',
  ) {
    return this.adminService.adminFindAllUsers(searchQuery, limit, skip, sort);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, RestrictJwtSessionGuard)
  @SetMetadata('sessionType', [SessionType.Auth])
  @SetMetadata('roles', [UserRole.SystemAdmin])
  @Get('user/:user_id')
  findOne(@Param('user_id') id: string) {
    return this.adminService.adminFindUserById(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, RestrictJwtSessionGuard)
  @SetMetadata('sessionType', [SessionType.Auth])
  @SetMetadata('roles', [UserRole.SystemAdmin])
  @Get('user/:user_id/auth-entities')
  getAuthEntities(@Param('user_id') user_id: string) {
    return this.adminService.adminGetUserAuthEntities(user_id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, RestrictJwtSessionGuard)
  @SetMetadata('sessionType', [SessionType.Auth])
  @SetMetadata('roles', [UserRole.SystemAdmin])
  @Post('user/:user_id/auth-entities/:auth_id/make-primary')
  @HttpCode(200)
  setPrimaryEntity(
    @Param('auth_id') auth_id: string,
    @Param('user_id') user_id: string,
  ) {
    return this.adminService.adminSetPrimaryAuthEntity(user_id, auth_id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, RestrictJwtSessionGuard)
  @SetMetadata('sessionType', [SessionType.Auth])
  @SetMetadata('roles', [UserRole.SystemAdmin])
  @Post('user/:user_id/auth-entities/')
  createAuthEntity(
    @Param('user_id') user_id: string,
    @Body() authDto: AdminCreateAuthEntityDto,
  ) {
    return this.adminService.adminCreateAuthEntity(user_id, authDto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, RestrictJwtSessionGuard)
  @SetMetadata('sessionType', [SessionType.Auth])
  @SetMetadata('roles', [UserRole.SystemAdmin])
  @Delete('user/:user_id/auth-entities/:auth_id')
  @HttpCode(204)
  deleteAuthEntity(
    @Param('auth_id') id: string,
    @Param('user_id') user_id: string,
  ) {
    return this.adminService.adminDeleteUserAuthEntity(user_id, id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, RestrictJwtSessionGuard)
  @SetMetadata('sessionType', [SessionType.Auth])
  @SetMetadata('roles', [UserRole.SystemAdmin])
  @Patch('user/:user_id')
  update(@Param('user_id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.adminService.adminUpdateUserById(id, updateUserDto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, RestrictJwtSessionGuard)
  @SetMetadata('sessionType', [SessionType.Auth])
  @SetMetadata('roles', [UserRole.SystemAdmin])
  @HttpCode(204)
  @Delete('user/:user_id')
  remove(@Param('user_id') id: string) {
    return this.adminService.adminRemoveUserById(id);
  }
}
