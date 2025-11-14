import { Module, forwardRef } from "@nestjs/common";
import { DataSourcesService } from "./data-source.service";
import { FileDataStrategy } from "./strategies/file-data.strategy";
import { CrawlerDataStrategy } from "./strategies/crawler-data.strategy";
import { UploadModule } from "../upload/upload.module";
import { CrawlerModule } from "../crawler/crawler.module";

@Module({
    imports: [forwardRef(() => UploadModule), CrawlerModule],
    controllers: [],
    providers: [DataSourcesService, FileDataStrategy, CrawlerDataStrategy],
    exports: [DataSourcesService],
})
export class DataSourceModule {}


