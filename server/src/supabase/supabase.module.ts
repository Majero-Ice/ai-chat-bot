import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { SUPABASE_CLIENT } from './supabase.constants';

export interface SupabaseModuleOptions {
	url: string;
	key: string;
	clientOptions?: Parameters<typeof createClient>[2];
}

@Global()
@Module({})
export class SupabaseModule {
	static forRoot(options: SupabaseModuleOptions): DynamicModule {
		const clientProvider = {
			provide: SUPABASE_CLIENT,
			useFactory: (): SupabaseClient => {
				return createClient(options.url, options.key, options.clientOptions);
			},
		};

		return {
			module: SupabaseModule,
			providers: [clientProvider, SupabaseService],
			exports: [clientProvider, SupabaseService],
		};
	}

	static forRootFromEnv(): DynamicModule {
		const url = process.env.SUPABASE_URL;
		const key = process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
		if (!url || !key) {
			throw new Error('Supabase configuration missing: set SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY).');
		}
		return SupabaseModule.forRoot({ url, key });
	}

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


