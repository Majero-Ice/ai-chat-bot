export interface CrawledPage {
  url: string;
  title: string;
  content: string;
  timestamp: Date;
  htmlFilePath?: string; // Путь к сохраненному HTML файлу
}

export interface CrawlerResult {
  pages: CrawledPage[];
  totalPages: number;
  errors: CrawlerError[];
}

export interface CrawlerError {
  url: string;
  error: string;
  timestamp: Date;
}

