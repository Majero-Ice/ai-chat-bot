export interface DataSourceStrategy {
  getData(source: string): Promise<any>;
}