import { Module } from '@nestjs/common';
import { UsersService, USERS_REPOSITORY } from './users.service';
import { SupabaseUsersRepository } from './repositories/supabase-users.repository';
import { CoreModule } from '../../../core/core.module';

@Module({
	imports: [CoreModule],
	providers: [
		UsersService,
		{ provide: USERS_REPOSITORY, useClass: SupabaseUsersRepository },
	],
	exports: [UsersService],
})
export class UsersModule {}


