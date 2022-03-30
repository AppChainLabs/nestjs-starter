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
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/roles-guard.guard';
import { JwtAuthGuard } from '../auth/jwt-guard.guard';
import { UserRole } from './entities/user.entity';

@ApiTags('user')
@Controller('api/user')
@UseGuards(RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @SetMetadata('roles', [UserRole.SystemAdmin])
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @SetMetadata('roles', [UserRole.SystemAdmin])
  findAll(
    @Query('searchQuery') searchQuery: string,
    @Query('limit') limit: number,
    @Query('skip') skip: number,
    @Optional() @Query('sort') sort = '-createdAt',
  ) {
    return this.userService.findAll(searchQuery, limit, skip, sort);
  }

  @Get(':user_id')
  @UseGuards(JwtAuthGuard)
  @SetMetadata('roles', [UserRole.SystemAdmin])
  findOne(@Param('user_id') id: string) {
    return this.userService.findById(id);
  }

  @Patch(':user_id')
  @UseGuards(JwtAuthGuard)
  @SetMetadata('roles', [UserRole.SystemAdmin])
  update(@Param('user_id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':user_id')
  @UseGuards(JwtAuthGuard)
  @SetMetadata('roles', [UserRole.SystemAdmin])
  remove(@Param('user_id') id: string) {
    return this.userService.remove(id);
  }
}
