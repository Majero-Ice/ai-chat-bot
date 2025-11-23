import { Injectable } from "@nestjs/common";
import { DataSourceStrategy } from "./interfaces/data-source.interface";
import { FileDataStrategy } from "./strategies/file-data.strategy";
import { CrawlerDataStrategy } from "./strategies/crawler-data.strategy";

@Injectable()
export class DataSourcesService {
  private strategies: Record<string, DataSourceStrategy>;

  constructor(
    private fileStrategy: FileDataStrategy,
    private crawlerStrategy: CrawlerDataStrategy,
  ) {
    this.strategies = {
      file: this.fileStrategy,
      crawler: this.crawlerStrategy,
    };
  }

  async getData(type: 'file' | 'crawler', source: string, options?: any): Promise<string> {
    const strategy = this.strategies[type];
    if (!strategy) {
      throw new Error(`Unknown data source type: ${type}`);
    }
    return strategy.getData(source, options);
  }
}


