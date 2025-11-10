import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadModule } from './modules/upload/upload.module';
import { DataSourceModule } from './modules/data-sources/data-source.module';
import { ParserModule } from './modules/parser/parser.module';
import { CoreModule } from './core/core.module';
import { FilesModule } from './modules/db/files/files.module';
import { TextChunksModule } from './modules/db/text-chunks/text-chunks.module';
import { EmbeddingsModule } from './modules/ai/embeddings.module';


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
	CoreModule,
	FilesModule,
	TextChunksModule,
	EmbeddingsModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
