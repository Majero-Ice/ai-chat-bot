import { Module } from '@nestjs/common';
import { UploadModule } from './upload/upload.module';
import { DataSourceModule } from './data-sources/data-source.module';
import { ParserModule } from './parser/parser.module';


@Module({
  imports: [UploadModule, DataSourceModule, ParserModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
