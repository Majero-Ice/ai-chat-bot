import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { UploadService } from './upload.service';
import { FileUploadResult } from './interfaces/upload-file.interface';
import { memoryStorage } from 'multer';
import { decodeFilename } from './utils/decode-filename.util';
import { decodeFileContent } from './utils/decode-file-content.util';
import { DataSourcesService } from '../data-sources/data-source.service';
import { ContentProcessingService } from './services/content-processing.service';
import { ContentSourceType, ParserType } from './dto/upload-content.dto';
import type { UploadContentDto } from './dto/upload-content.dto';

@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly dataSourcesService: DataSourcesService,
    private readonly contentProcessingService: ContentProcessingService,
  ) {}

  /**
   * Универсальный эндпоинт для загрузки контента из разных источников
   * Поддерживает: файлы, краулер
   */
  @Post('content')
  @HttpCode(HttpStatus.OK)
  async uploadContent(@Body() dto: UploadContentDto) {
    const {
      sourceType,
      source,
      fileName,
      parserType,
      crawlerOptions,
      skipEmbeddings = false,
    } = dto;

    // Определяем имя файла
    const finalFileName = fileName || this.getFileNameFromSource(source, sourceType);

    // Определяем тип парсера
    const finalParserType = parserType || this.getParserTypeFromSourceType(sourceType);

    // Получаем данные из источника
    let content: string;
    try {
      if (sourceType === ContentSourceType.CRAWLER) {
        content = await this.dataSourcesService.getData('crawler', source, crawlerOptions);
      } else {
        content = await this.dataSourcesService.getData(sourceType, source);
      }
    } catch (error) {
      throw new BadRequestException(
        `Failed to get data from source: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // Обрабатываем контент
    const result = await this.contentProcessingService.processContent(content, {
      fileName: finalFileName,
      parserType: finalParserType,
      skipEmbeddings,
      sourceType,
      sourceUrl: sourceType === ContentSourceType.CRAWLER ? source : undefined,
    });

    return {
      success: true,
      fileId: result.fileId,
      siteId: result.siteId,
      chunksCount: result.chunksCount,
      embeddingsCount: result.embeddingsCount,
      pagesCount: result.pagesCount,
    };
  }

  /**
   * Эндпоинт для загрузки файла (обратная совместимость)
   * Использует новый ContentProcessingService
   */
  @Post('file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        // Разрешаем только текстовые файлы
        const allowedMimeTypes = [
          'text/plain',
          'text/csv',
          'application/json',
          'text/markdown',
          'text/html',
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `File type ${file.mimetype} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`,
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Декодируем имя файла
    let decodedFilename = file.originalname;
    try {
      decodedFilename = decodeFilename(file.originalname);
      if (decodedFilename !== file.originalname) {
        console.log(`[Upload] Decoded filename: "${file.originalname}" -> "${decodedFilename}"`);
      }
    } catch (error) {
      console.warn('Failed to decode filename, using original:', file.originalname, error);
    }

    // Декодируем содержимое файла
    const fileContent = decodeFileContent(file.buffer);

    // Сохраняем файл
    const uploadResult = await this.uploadService.saveFile(file);

    // Обрабатываем контент через новый сервис
    try {
      const processResult = await this.contentProcessingService.processContent(fileContent, {
        fileName: decodedFilename,
        parserType: 'file',
        skipEmbeddings: false,
      });

      // Устанавливаем правильные заголовки с кодировкой UTF-8
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(HttpStatus.OK).json({
        ...uploadResult,
        processing: {
          fileId: processResult.fileId,
          chunksCount: processResult.chunksCount,
          embeddingsCount: processResult.embeddingsCount,
        },
      });
    } catch (error) {
      // Ошибка обработки не прерывает загрузку файла
      console.error('Failed to process file:', error);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(HttpStatus.OK).json(uploadResult);
    }
  }

  /**
   * Определяет имя файла из источника
   */
  private getFileNameFromSource(source: string, sourceType: ContentSourceType): string {
    if (sourceType === ContentSourceType.FILE) {
      return source.split(/[/\\]/).pop() || 'file';
    }
    if (sourceType === ContentSourceType.CRAWLER) {
      try {
        const url = new URL(source);
        return url.hostname + url.pathname.replace(/[^a-zA-Z0-9]/g, '_') || 'web-content';
      } catch {
        return 'web-content';
      }
    }
    return 'untitled';
  }

  /**
   * Определяет тип парсера из типа источника
   */
  private getParserTypeFromSourceType(sourceType: ContentSourceType): ParserType {
    switch (sourceType) {
      case ContentSourceType.CRAWLER:
        return ParserType.CRAWLER;
      case ContentSourceType.FILE:
      default:
        return ParserType.FILE;
    }
  }
}
