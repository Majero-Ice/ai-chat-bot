import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { FileUploadResult } from './interfaces/upload-file.interface';
import { ParserService } from '../parser/parser.service';
import { memoryStorage } from 'multer';
import { FilesService } from '../db/files/files.service';
import { TextChunksService } from '../db/text-chunks/text-chunks.service';

@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly parserService: ParserService,
    private readonly textChunksService: TextChunksService,
    private readonly filesService: FilesService
  ) {}

  @Post('file')
  @HttpCode(HttpStatus.OK)
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
  ): Promise<FileUploadResult> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const result = await this.uploadService.saveFile(file);

    // Парсим файл
    try {
      const fileEntity = await this.filesService.create(file.originalname);
      
      const fileContent = file.buffer.toString('utf-8');
      const parseResult = await this.parserService.parse('file', fileContent);
      if (parseResult.chunks && parseResult.chunks.length > 0) {
        await this.textChunksService.insertMany(parseResult.chunks.map((chunk) => ({
          file_id: fileEntity.id,
          chunk_index: chunk.index,
          text: chunk.content,
        })));
      }
    } catch (error) {
      // Ошибка парсинга не прерывает загрузку файла
    }

    return result;
  }


}



