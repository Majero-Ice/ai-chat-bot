import { Injectable } from "@nestjs/common";
import { DataSourceStrategy } from "./interfaces/data-source.interface";
import { FileDataStrategy } from "./strategies/file-data.strategy";
import { HttpDataStrategy } from "./strategies/http-data.strategy";

@Injectable()
export class DataSourcesService {
  private strategies: Record<string, DataSourceStrategy>;

  constructor(
    private fileStrategy: FileDataStrategy,
    private httpStrategy: HttpDataStrategy,
  ) {
    this.strategies = {
      file: this.fileStrategy,
      http: this.httpStrategy,
    };
  }

  async getData(type: 'file' | 'http', source: string) {
    const strategy = this.strategies[type];
    if (!strategy) {
      throw new Error(`Unknown data source type: ${type}`);
    }
    return strategy.getData(source);
  }
}


