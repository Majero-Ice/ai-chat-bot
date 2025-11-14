import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSourceStrategy } from '../interfaces/data-source.interface';
import { WebCrawlerService } from '../../crawler/crawler.service';
import type { CrawlerOptions } from '../../crawler/interfaces/crawler-options.interface';

/**
 * Стратегия для получения данных через краулер
 * Принимает URL и опции краулера, возвращает JSON строку с результатом
 */
@Injectable()
export class CrawlerDataStrategy implements DataSourceStrategy {
  constructor(private readonly crawlerService: WebCrawlerService) {}

  async getData(source: string, options?: CrawlerOptions): Promise<string> {
    try {
      // source должен быть URL
      if (!source || (!source.startsWith('http://') && !source.startsWith('https://'))) {
        throw new BadRequestException(`Invalid URL for crawler: ${source}`);
      }

      // Обходим сайт
      const result = await this.crawlerService.crawl(source, options);

      // Возвращаем результат как JSON строку
      return JSON.stringify(result);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to crawl ${source}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

