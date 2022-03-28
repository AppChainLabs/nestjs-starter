import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll(
    @Query('searchQuery') searchQuery: string,
    @Query('limit') limit: number,
    @Query('skip') skip: number,
    @Query('sort') sort: string,
  ) {
    return this.userService.findAll(searchQuery, limit, skip, sort);
  }

  @Get(':user_id')
  findOne(@Param('user_id') id: string) {
    return this.userService.findById(id);
  }

  @Patch(':user_id')
  update(@Param('user_id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':user_id')
  remove(@Param('user_id') id: string) {
    return this.userService.remove(id);
  }
}
