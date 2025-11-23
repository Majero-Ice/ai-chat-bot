import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { AiModule } from './ai/ai.module';
import { CrawlerModule } from './crawler/crawler.module';

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
		CrawlerModule.forRootAsync(),
	],
	exports: [SupabaseModule, AiModule, CrawlerModule],
})
export class CoreModule {}


