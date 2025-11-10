import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { AiModule } from './ai/ai.module';

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
		AiModule.forRootAsyncFromEnv(),
	],
	exports: [SupabaseModule, AiModule],
})
export class CoreModule {}


