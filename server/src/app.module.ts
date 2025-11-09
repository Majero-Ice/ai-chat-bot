import { Module } from '@nestjs/common';
import { UploadModule } from './upload/upload.module';
import { DataSourceModule } from './data-sources/data-source.module';


@Module({
  imports: [UploadModule, DataSourceModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
