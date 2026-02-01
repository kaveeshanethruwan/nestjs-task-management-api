import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Delete,
  Param,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { Public } from 'src/auth/decorators/public.decorator';
import { AppLoggerService } from 'src/common/services/logger.service';
import { Request } from 'express';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UserController {
  private readonly logger = new AppLoggerService();

  constructor(private readonly userService: UserService) {
    this.logger.setContext('UserController');
  }

  @Public()
  @Post()
  create(
    @Body() createUserDto: CreateUserDto,
    @Req() req: Request & { id?: string },
  ) {
    this.logger.log('Creating new user', {
      requestId: req.id,
      email: createUserDto.email,
    });
    return this.userService.create(createUserDto, req.id);
  }

  @Get()
  findAll(@Req() req: Request & { id?: string }) {
    this.logger.log('Fetching all users', { requestId: req.id });
    return this.userService.findAll(req.id);
  }

  @Get('profile')
  getProfile(@Req() req: Request & { user: { id: number }; id?: string }) {
    this.logger.log('Fetching user profile', {
      requestId: req.id,
      userId: req.user.id,
    });
    return this.userService.findOne(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request & { id?: string }) {
    this.logger.log('Fetching user by ID', {
      requestId: req.id,
      userId: +id,
    });
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request & { id?: string },
  ) {
    this.logger.log('Updating user', {
      requestId: req.id,
      userId: +id,
    });
    return this.userService.update(+id, updateUserDto, req.id);
  }

  @Roles(Role.ADMIN, Role.EDITOR)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request & { id?: string }) {
    this.logger.log('Deleting user', {
      requestId: req.id,
      userId: +id,
    });
    return this.userService.remove(+id, req.id);
  }
}
