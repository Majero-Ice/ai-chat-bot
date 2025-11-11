import { Module } from '@nestjs/common';
import { CoreModule } from '../../../core/core.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { TextChunksModule } from '../../db/text-chunks/text-chunks.module';
import { SemanticSearchService } from './semantic-search.service';

@Module({
	imports: [CoreModule, EmbeddingsModule, TextChunksModule],
	providers: [SemanticSearchService],
	exports: [SemanticSearchService],
})
export class SemanticSearchModule {}

