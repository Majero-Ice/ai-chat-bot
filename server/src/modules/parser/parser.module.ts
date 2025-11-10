import { Module } from "@nestjs/common";
import { ParserService } from "./parser.service";
import { FileDataStrategy } from "./strategies/file-data.strategy";
import { JsonDataStrategy } from "./strategies/json-data.strategy";

@Module({
    imports: [],
    controllers: [],
    providers: [ParserService, FileDataStrategy, JsonDataStrategy],
    exports: [ParserService],
})
export class ParserModule {}


