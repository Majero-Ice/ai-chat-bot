import { Module } from "@nestjs/common";
import { DataSourcesService } from "./data-source.service";
import { FileDataStrategy } from "./strategies/file-data.strategy";
import { HttpDataStrategy } from "./strategies/http-data.strategy";
import { UploadModule } from "../upload/upload.module";

@Module({
    imports: [UploadModule],
    controllers: [],
    providers: [DataSourcesService, FileDataStrategy, HttpDataStrategy],
    exports: [DataSourcesService],
})
export class DataSourceModule {}


