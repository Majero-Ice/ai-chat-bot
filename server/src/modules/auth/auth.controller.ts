import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	@HttpCode(HttpStatus.CREATED)
	async register(@Body() registerDto: RegisterDto) {
		return this.authService.register(registerDto);
	}

	@Post('login')
	@HttpCode(HttpStatus.OK)
	async login(@Body() loginDto: LoginDto) {
		return this.authService.login(loginDto);
	}

	@Post('refresh')
	@HttpCode(HttpStatus.OK)
	async refresh(@Body('refresh_token') refreshToken: string) {
		return this.authService.refreshToken(refreshToken);
	}

	@Post('logout')
	@HttpCode(HttpStatus.OK)
	async logout(@Body('token') token: string) {
		return this.authService.logout(token);
	}
}


