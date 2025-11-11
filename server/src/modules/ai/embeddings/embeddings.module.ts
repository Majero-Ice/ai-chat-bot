import { Module } from '@nestjs/common';
import { CoreModule } from '../../../core/core.module';
import { EmbeddingsService } from './embeddings.service';

@Module({
	imports: [CoreModule],
	providers: [EmbeddingsService],
	exports: [EmbeddingsService],
})
export class EmbeddingsModule {}

