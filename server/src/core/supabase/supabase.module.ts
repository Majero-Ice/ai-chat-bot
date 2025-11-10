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
				const key = config.get<string>('SUPABASE_ANON_KEY') ?? config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
				if (!url || !key) {
					throw new Error('Supabase configuration missing: set SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY).');
				}
				return createClient(url, key);
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


