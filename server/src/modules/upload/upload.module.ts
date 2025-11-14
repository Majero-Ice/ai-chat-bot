import { Module, forwardRef } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { ContentProcessingService } from './services/content-processing.service';
import { ParserModule } from '../parser/parser.module';
import { FilesModule } from '../db/files/files.module';
import { TextChunksModule } from '../db/text-chunks/text-chunks.module';
import { EmbeddingsModule } from '../ai/embeddings/embeddings.module';
import { SitesModule } from '../db/sites/sites.module';
import { SitePagesModule } from '../db/site-pages/site-pages.module';
import { DataSourceModule } from '../data-sources/data-source.module';

@Module({
  imports: [
    ParserModule,
    FilesModule,
    TextChunksModule,
    EmbeddingsModule,
    SitesModule,
    SitePagesModule,
    forwardRef(() => DataSourceModule),
  ],
  controllers: [UploadController],
  providers: [UploadService, ContentProcessingService],
  exports: [UploadService, ContentProcessingService],
})
export class UploadModule {}


