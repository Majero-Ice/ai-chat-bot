export interface DataSourceStrategy {
  getData(source: string, options?: any): Promise<string>;
}


