import { Inject, Injectable } from '@nestjs/common';
import { UserEntity } from './domain/user.entity';
import type { UsersRepositoryPort } from './repositories/users.repository.port';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

@Injectable()
export class UsersService {
	constructor(@Inject(USERS_REPOSITORY) private readonly users: UsersRepositoryPort) {}

	create(input: Pick<UserEntity, 'id' | 'email' | 'full_name'>): Promise<UserEntity> {
		return this.users.create(input);
	}

	findById(id: string): Promise<UserEntity | null> {
		return this.users.findById(id);
	}

	findByEmail(email: string): Promise<UserEntity | null> {
		return this.users.findByEmail(email);
	}

	update(
		id: string,
		input: Partial<Pick<UserEntity, 'email' | 'full_name' | 'avatar_url'>>,
	): Promise<UserEntity> {
		return this.users.update(id, input);
	}

	deleteById(id: string): Promise<void> {
		return this.users.deleteById(id);
	}
}

