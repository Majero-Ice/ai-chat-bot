import { Module } from '@nestjs/common';
import { WebCrawlerService } from './crawler.service';

@Module({
  imports: [],
  controllers: [],
  providers: [WebCrawlerService],
  exports: [WebCrawlerService],
})
export class CrawlerModule {}

