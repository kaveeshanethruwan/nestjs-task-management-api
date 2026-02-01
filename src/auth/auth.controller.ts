import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RefreshAuthGuard } from './guards/refresh-auth/refresh-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const { id } = await this.authService.validateUser(dto.email, dto.password);
    return this.authService.login(Number(id));
  }

  @UseGuards(RefreshAuthGuard)
  @Post('refresh')
  refreshToken(@Request() req: { user: { id: number } }) {
    return this.authService.refreshToken(Number(req?.user.id));
  }

  @UseGuards(JwtAuthGuard)
  @Post('signout')
  async signOut(@Request() req: { user: { id: number } }) {
    await this.authService.signOut(Number(req?.user.id));
  }
}
