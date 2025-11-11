import { Module } from '@nestjs/common';
import { CoreModule } from '../../../core/core.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { SemanticSearchModule } from '../semantic-search/semantic-search.module';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';

@Module({
	imports: [CoreModule, EmbeddingsModule, SemanticSearchModule],
	controllers: [ChatController],
	providers: [ChatService],
	exports: [ChatService],
})
export class ChatModule {}


