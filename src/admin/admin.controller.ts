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
  Request,
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
import { PasswordAuthStrategy } from '../auth/password-auth.strategy';
import { AdminLoginDto } from './dto/admin-login.dto';

@ApiBearerAuth('Bearer')
@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly userService: UserService,
  ) {}

  @UseGuards(AuthGuard(PasswordAuthStrategy.key), RolesGuard)
  @SetMetadata('roles', [UserRole.SystemAdmin])
  @Post('login/')
  async adminLogin(@Body() adminLoginDto: AdminLoginDto, @Request() req) {
    const session = req.user;
    return this.adminService.adminLogin(session, adminLoginDto.token);
  }

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
    @Query('searchQuery') searchQuery: string,
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
  @Delete('user/:user_id/auth-entities/:auth_id')
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
  @Delete('user/:user_id')
  remove(@Param('user_id') id: string) {
    return this.adminService.adminRemoveUserById(id);
  }
}
