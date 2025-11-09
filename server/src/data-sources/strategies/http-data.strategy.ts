import { Injectable } from '@nestjs/common';
import { DataSourceStrategy } from '../interfaces/data-source.interface';

@Injectable()
export class HttpDataStrategy implements DataSourceStrategy {
  async getData(source: string): Promise<any> {
    // TODO: Implement HTTP data fetching
    throw new Error('HTTP data strategy not implemented yet');
  }
}

