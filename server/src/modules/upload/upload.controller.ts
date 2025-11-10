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
import { EmbeddingsService } from '../ai/embeddings.service';

@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly parserService: ParserService,
    private readonly textChunksService: TextChunksService,
    private readonly filesService: FilesService,
    private readonly embeddingsService: EmbeddingsService,
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

    // Парсим файл и создаем эмбеддинги
    try {
      const fileEntity = await this.filesService.create(file.originalname);
      
      const fileContent = file.buffer.toString('utf-8');
      const parseResult = await this.parserService.parse('file', fileContent);
      if (parseResult.chunks && parseResult.chunks.length > 0) {
        const chunks = parseResult.chunks.map((chunk) => ({
          file_id: fileEntity.id,
          chunk_index: chunk.index,
          text: chunk.content,
        }));

        // Создаем эмбеддинги для всех чанков
        try {
          const texts = chunks.map((chunk) => chunk.text);
          const embeddings = await this.embeddingsService.createEmbeddings(texts);
          
          // Добавляем эмбеддинги к чанкам
          const chunksWithEmbeddings = chunks.map((chunk, index) => ({
            ...chunk,
            embedding: embeddings[index],
          }));

          await this.textChunksService.insertMany(chunksWithEmbeddings);
        } catch (embeddingError) {
          // Если не удалось создать эмбеддинги, сохраняем чанки без эмбеддингов
          console.error('Failed to create embeddings:', embeddingError);
          await this.textChunksService.insertMany(chunks);
        }
      }
    } catch (error) {
      // Ошибка парсинга не прерывает загрузку файла
      console.error('Failed to parse file:', error);
    }

    return result;
  }


}



