import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { ParserModule } from '../parser/parser.module';
import { FilesModule } from '../db/files/files.module';
import { TextChunksModule } from '../db/text-chunks/text-chunks.module';

@Module({
  imports: [ParserModule, FilesModule, TextChunksModule],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}


