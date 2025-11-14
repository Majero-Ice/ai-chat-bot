import type { CrawlerOptions } from '../../crawler/interfaces/crawler-options.interface';

export enum ContentSourceType {
  FILE = 'file',
  CRAWLER = 'crawler',
}

export enum ParserType {
  FILE = 'file',
  JSON = 'json',
  CRAWLER = 'crawler',
}

export interface UploadContentDto {
  sourceType: ContentSourceType;
  source: string;
  fileName?: string;
  parserType?: ParserType;
  crawlerOptions?: CrawlerOptions;
  skipEmbeddings?: boolean;
}

