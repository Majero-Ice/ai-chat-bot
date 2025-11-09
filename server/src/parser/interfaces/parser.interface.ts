export interface ParserStrategy {
    parse(data: string): Promise<any>;
  }