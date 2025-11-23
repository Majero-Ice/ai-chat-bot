import { Module } from '@nestjs/common';
import { WebCrawlerService } from './crawler.service';
import { HtmlStorageService } from './services/html-storage.service';

@Module({
  imports: [],
  controllers: [],
  providers: [WebCrawlerService, HtmlStorageService],
  exports: [WebCrawlerService, HtmlStorageService],
})
export class CrawlerModule {}

