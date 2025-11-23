import { Module } from "@nestjs/common";
import { ParserService } from "./parser.service";
import { FileDataStrategy } from "./strategies/file-data.strategy";
import { JsonDataStrategy } from "./strategies/json-data.strategy";
import { CrawlerDataStrategy } from "./strategies/crawler-data.strategy";

@Module({
    imports: [],
    controllers: [],
    providers: [ParserService, FileDataStrategy, JsonDataStrategy, CrawlerDataStrategy],
    exports: [ParserService],
})
export class ParserModule {}


