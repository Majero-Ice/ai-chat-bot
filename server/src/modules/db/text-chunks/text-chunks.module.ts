import { Module } from '@nestjs/common';
import { CoreModule } from '../../../core/core.module';
import { TextChunksService, TEXT_CHUNKS_REPOSITORY } from './text-chunks.service';
import { SupabaseTextChunksRepository } from './repositories/supabase-text-chunks.repository';

@Module({
	imports: [CoreModule],
	providers: [
		TextChunksService,
		{ provide: TEXT_CHUNKS_REPOSITORY, useClass: SupabaseTextChunksRepository },
	],
	exports: [TextChunksService],
})
export class TextChunksModule {}

