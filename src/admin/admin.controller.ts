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
  BadRequestException,
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
@UseGuards(AuthGuard('jwt'), RolesGuard, RestrictJwtSessionGuard)
@SetMetadata('sessionType', [SessionType.Auth])
@SetMetadata('roles', [UserRole.SystemAdmin])
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly userService: UserService,
  ) {}

  @Post('user/')
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get('user/')
  findAll(
    @Query('searchQuery') searchQuery: string,
    @Query('limit') limit: number,
    @Query('skip') skip: number,
    @Optional() @Query('sort') sort = '-createdAt',
  ) {
    return this.adminService.adminFindAllUsers(searchQuery, limit, skip, sort);
  }

  @Get('user/:user_id')
  findOne(@Param('user_id') id: string) {
    return this.adminService.adminFindUserById(id);
  }

  @Get('user/:user_id/auth-entities')
  getAuthEntities(@Param('user_id') user_id: string) {
    return this.adminService.adminGetUserAuthEntities(user_id);
  }

  @Post('user/:user_id/auth-entities/:auth_id/make-primary')
  setPrimaryEntity(
    @Param('auth_id') auth_id: string,
    @Param('user_id') user_id: string,
  ) {
    return this.adminService.adminSetPrimaryAuthEntity(user_id, auth_id);
  }

  @Post('user/:user_id/auth-entities/')
  createAuthEntity(
    @Param('user_id') user_id: string,
    @Body() authDto: AdminCreateAuthEntityDto,
  ) {
    return this.adminService.adminCreateAuthEntity(authDto);
  }

  @Delete('user/:user_id/auth-entities/:auth_id')
  deleteAuthEntity(
    @Param('auth_id') id: string,
    @Param('user_id') user_id: string,
  ) {
    return this.adminService.adminDeleteUserAuthEntity(user_id, id);
  }

  @Patch('user/:user_id')
  update(@Param('user_id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.adminService.adminUpdateUserById(id, updateUserDto);
  }

  @Delete('user/:user_id')
  remove(@Param('user_id') id: string) {
    return this.adminService.adminRemoveUserById(id);
  }
}
