import { Injectable } from "@nestjs/common";
import { ParserStrategy } from "./interfaces/parser.interface";
import { FileDataStrategy } from "./strategies/file-data.strategy";
import { JsonDataStrategy } from "./strategies/json-data.strategy";
import { CrawlerDataStrategy } from "./strategies/crawler-data.strategy";

@Injectable()
export class ParserService {
  private strategies: Record<string, ParserStrategy>;

  constructor(
    private fileStrategy: FileDataStrategy,
    private jsonStrategy: JsonDataStrategy,
    private crawlerStrategy: CrawlerDataStrategy,
  ) {
    this.strategies = {
      file: this.fileStrategy,
      json: this.jsonStrategy,
      crawler: this.crawlerStrategy,
    };
  }

  async parse(type: 'file' | 'json' | 'crawler', data: string) {
    const strategy = this.strategies[type];
    if (!strategy) {
      throw new Error(`Unknown parser type: ${type}`);
    }
    return strategy.parse(data);
  }
}
