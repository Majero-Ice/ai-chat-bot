import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../../core/supabase/base.repository';
import { UserEntity } from '../domain/user.entity';
import { UsersRepositoryPort } from './users.repository.port';

@Injectable()
export class SupabaseUsersRepository extends BaseRepository<UserEntity> implements UsersRepositoryPort {
	protected readonly table = 'users';

	async create(user: Pick<UserEntity, 'id' | 'email' | 'full_name'>): Promise<UserEntity> {
		const { data, error } = await this.from()
			.insert({
				id: user.id,
				email: user.email,
				full_name: user.full_name,
			})
			.select('*')
			.single();
		if (error) throw error;
		return data as UserEntity;
	}

	async findById(id: string): Promise<UserEntity | null> {
		const { data, error } = await this.from().select('*').eq('id', id).maybeSingle();
		if (error) throw error;
		return data as UserEntity | null;
	}

	async findByEmail(email: string): Promise<UserEntity | null> {
		const { data, error } = await this.from().select('*').eq('email', email).maybeSingle();
		if (error) throw error;
		return data as UserEntity | null;
	}

	async update(
		id: string,
		input: Partial<Pick<UserEntity, 'email' | 'full_name' | 'avatar_url'>>,
	): Promise<UserEntity> {
		const { data, error } = await this.from()
			.update({ ...input, updated_at: new Date().toISOString() })
			.eq('id', id)
			.select('*')
			.single();
		if (error) throw error;
		return data as UserEntity;
	}

	async deleteById(id: string): Promise<void> {
		const { error } = await this.from().delete().eq('id', id);
		if (error) throw error;
	}
}

