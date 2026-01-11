import { UserEntity } from '../domain/user.entity';

export interface UsersRepositoryPort {
	create(input: Pick<UserEntity, 'id' | 'email' | 'full_name'>): Promise<UserEntity>;
	findById(id: string): Promise<UserEntity | null>;
	findByEmail(email: string): Promise<UserEntity | null>;
	update(id: string, input: Partial<Pick<UserEntity, 'email' | 'full_name' | 'avatar_url'>>): Promise<UserEntity>;
	deleteById(id: string): Promise<void>;
}

