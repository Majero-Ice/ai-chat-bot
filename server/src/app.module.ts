import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadModule } from './upload/upload.module';
import { DataSourceModule } from './data-sources/data-source.module';
import { ParserModule } from './parser/parser.module';
import { SupabaseModule } from './supabase/supabase.module';


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
	UploadModule,
	DataSourceModule,
	ParserModule,
	SupabaseModule.forRootAsyncFromEnv()
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
