import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { UsersService } from '../db/users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
	constructor(
		private readonly supabase: SupabaseService,
		private readonly usersService: UsersService,
	) {}

	async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
		const { email, password, full_name } = registerDto;

		// Проверяем, существует ли пользователь
		const existingUser = await this.usersService.findByEmail(email);
		if (existingUser) {
			throw new ConflictException('User with this email already exists');
		}

		// Создаем пользователя через Supabase Auth
		const supabaseClient = this.supabase.getClient();
		const { data: authData, error: authError } = await supabaseClient.auth.signUp({
			email,
			password,
			options: {
				data: {
					full_name: full_name || '',
				},
				// Отключаем подтверждение email для автоматической регистрации
				// Если в Supabase включено подтверждение, это может не сработать
				emailRedirectTo: undefined,
			},
		});

		if (authError) {
			console.error('Supabase signUp error:', {
				message: authError.message,
				status: authError.status,
				name: authError.name,
			});
			throw new UnauthorizedException(authError.message);
		}

		if (!authData.user) {
			console.error('SignUp successful but no user returned');
			throw new UnauthorizedException('Failed to create user');
		}

		console.log('User created in Supabase Auth:', {
			id: authData.user.id,
			email: authData.user.email,
			email_confirmed_at: authData.user.email_confirmed_at,
			has_session: !!authData.session,
		});

		// Если email не подтвержден и нет сессии, пытаемся войти сразу после регистрации
		// Это работает только если используется SERVICE_ROLE_KEY
		if (!authData.session && !authData.user.email_confirmed_at) {
			console.log('Email not confirmed, attempting auto-login...');
			const loginResult = await supabaseClient.auth.signInWithPassword({
				email,
				password,
			});
			
			if (loginResult.data?.session) {
				// Успешно вошли, используем эту сессию
				const user = await this.usersService.create({
					id: authData.user.id,
					email: authData.user.email!,
					full_name: full_name,
				});

				return {
					access_token: loginResult.data.session.access_token,
					refresh_token: loginResult.data.session.refresh_token,
					user: {
						id: user.id,
						email: user.email,
						full_name: user.full_name,
						avatar_url: user.avatar_url,
					},
				};
			} else {
				console.warn('Auto-login failed, user needs to confirm email');
			}
		}

		// Создаем запись в таблице users с id из Supabase Auth
		const user = await this.usersService.create({
			id: authData.user.id,
			email: authData.user.email!,
			full_name: full_name,
		});

		// Если требуется подтверждение email, сессия может быть null
		if (!authData.session) {
			// Возвращаем данные без токенов, если требуется подтверждение
			return {
				access_token: '',
				user: {
					id: user.id,
					email: user.email,
					full_name: user.full_name,
					avatar_url: user.avatar_url,
				},
			};
		}

		return {
			access_token: authData.session.access_token,
			refresh_token: authData.session.refresh_token,
			user: {
				id: user.id,
				email: user.email,
				full_name: user.full_name,
				avatar_url: user.avatar_url,
			},
		};
	}

	async login(loginDto: LoginDto): Promise<AuthResponseDto> {
		const { email, password } = loginDto;

		const supabaseClient = this.supabase.getClient();
		const { data, error } = await supabaseClient.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			// Логируем детальную ошибку для отладки
			console.error('Supabase login error:', {
				message: error.message,
				status: error.status,
				name: error.name,
			});
			
			// Проверяем конкретные типы ошибок
			if (error.message?.includes('Email not confirmed') || error.message?.includes('email_not_confirmed')) {
				throw new UnauthorizedException('Please confirm your email before logging in');
			}
			
			if (error.message?.includes('Invalid login credentials')) {
				throw new UnauthorizedException('Invalid email or password');
			}
			
			throw new UnauthorizedException(error.message || 'Invalid credentials');
		}

		if (!data.session) {
			console.error('Login successful but no session returned');
			throw new UnauthorizedException('Login failed: no session created');
		}

		// Получаем данные пользователя из нашей таблицы
		let user = await this.usersService.findByEmail(email);
		
		// Если пользователь существует в Supabase Auth, но не в таблице users, создаем запись
		if (!user && data.user) {
			user = await this.usersService.create({
				id: data.user.id,
				email: data.user.email!,
				full_name: data.user.user_metadata?.full_name,
			});
		}

		if (!user) {
			throw new UnauthorizedException('User not found');
		}

		return {
			access_token: data.session.access_token,
			refresh_token: data.session.refresh_token,
			user: {
				id: user.id,
				email: user.email,
				full_name: user.full_name,
				avatar_url: user.avatar_url,
			},
		};
	}

	async validateToken(token: string): Promise<any> {
		const supabaseClient = this.supabase.getClient();
		
		// Создаем временный клиент с токеном для валидации
		const { data, error } = await supabaseClient.auth.getUser(token);

		if (error || !data.user) {
			throw new UnauthorizedException('Invalid token');
		}

		// Получаем полную информацию о пользователе из нашей таблицы
		const user = await this.usersService.findById(data.user.id);
		if (!user) {
			throw new UnauthorizedException('User not found');
		}

		return {
			...data.user,
			id: user.id,
			email: user.email,
		};
	}

	async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
		const supabaseClient = this.supabase.getClient();
		const { data, error } = await supabaseClient.auth.refreshSession({
			refresh_token: refreshToken,
		});

		if (error || !data.session || !data.user) {
			throw new UnauthorizedException('Invalid refresh token');
		}

		const user = await this.usersService.findById(data.user.id);
		if (!user) {
			throw new UnauthorizedException('User not found');
		}

		return {
			access_token: data.session.access_token,
			refresh_token: data.session.refresh_token,
			user: {
				id: user.id,
				email: user.email,
				full_name: user.full_name,
				avatar_url: user.avatar_url,
			},
		};
	}

	async logout(token: string): Promise<void> {
		const supabaseClient = this.supabase.getClient();
		const { error } = await supabaseClient.auth.signOut();
		if (error) {
			throw new UnauthorizedException('Failed to logout');
		}
	}
}

