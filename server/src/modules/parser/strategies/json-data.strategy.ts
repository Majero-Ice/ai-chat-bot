import { Injectable, BadRequestException } from '@nestjs/common';
import { ParserStrategy } from '../interfaces/parser.interface';

@Injectable()
export class JsonDataStrategy implements ParserStrategy {
  async parse(data: string): Promise<any> {
    try {
      const parsed = JSON.parse(data);
      return { type: 'json', data: parsed, parsed: true };
    } catch (error) {
      throw new BadRequestException(`Failed to parse JSON: ${error.message}`);
    }
  }
}


