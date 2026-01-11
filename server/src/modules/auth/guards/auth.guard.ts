import {
	Injectable,
	CanActivate,
	ExecutionContext,
	UnauthorizedException,
	Logger,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
	private readonly logger = new Logger(AuthGuard.name);

	constructor(private readonly authService: AuthService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const authHeader = request.headers.authorization;

		if (!authHeader) {
			throw new UnauthorizedException('Authorization header is missing');
		}

		const token = authHeader.replace('Bearer ', '');

		if (!token) {
			throw new UnauthorizedException('Token is missing');
		}

		try {
			const user = await this.authService.validateToken(token);
			request.user = user;
			return true;
		} catch (error) {
			this.logger.error('Token validation failed:', error);
			throw new UnauthorizedException('Invalid or expired token');
		}
	}
}
