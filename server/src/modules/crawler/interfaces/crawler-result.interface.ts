export interface CrawledPage {
  url: string;
  title: string;
  content: string;
  timestamp: Date;
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

