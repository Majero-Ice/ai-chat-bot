import { Injectable } from '@nestjs/common';
import { DataSourceStrategy } from '../interfaces/data-source.interface';

@Injectable()
export class HttpDataStrategy implements DataSourceStrategy {
  async getData(source: string): Promise<any> {
    throw new Error('HTTP data strategy not implemented yet');
  }
}


