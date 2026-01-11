import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from './supabase.constants';
import { SupabaseService } from './supabase.service';

@Global()
@Module({})
export class SupabaseModule {
	static forRootAsyncFromEnv(): DynamicModule {
		const clientProvider = {
			provide: SUPABASE_CLIENT,
			inject: [ConfigService],
			useFactory: (config: ConfigService): SupabaseClient => {
				const url = config.get<string>('SUPABASE_URL');
				// Для аутентификации лучше использовать SERVICE_ROLE_KEY, чтобы обойти ограничения
				const serviceRoleKey = config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
				const anonKey = config.get<string>('SUPABASE_ANON_KEY');
				const key = serviceRoleKey ?? anonKey;
				
				if (!url || !key) {
					throw new Error('Supabase configuration missing: set SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY).');
				}
				
				const client = createClient(url, key, {
					auth: {
						// Автоматически подтверждаем email при использовании SERVICE_ROLE_KEY
						autoRefreshToken: true,
						persistSession: false,
					},
				});
				
				return client;
			},
		};

		return {
			module: SupabaseModule,
			imports: [ConfigModule],
			providers: [clientProvider, SupabaseService],
			exports: [clientProvider, SupabaseService],
		};
	}
}


