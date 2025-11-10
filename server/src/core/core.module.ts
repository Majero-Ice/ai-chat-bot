import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';

@Global()
@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: [
				'.env.local',
				'.env',
				'../.env.local',
				'../.env',
				'../../.env.local',
				'../../.env'
			],
			cache: true,
		}),
		SupabaseModule.forRootAsyncFromEnv(),
	],
	exports: [SupabaseModule],
})
export class CoreModule {}


