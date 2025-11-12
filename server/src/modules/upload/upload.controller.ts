import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { UploadService } from './upload.service';
import { FileUploadResult } from './interfaces/upload-file.interface';
import { ParserService } from '../parser/parser.service';
import { memoryStorage } from 'multer';
import { FilesService } from '../db/files/files.service';
import { TextChunksService } from '../db/text-chunks/text-chunks.service';
import { EmbeddingsService } from '../ai/embeddings/embeddings.service';
import { decodeFilename, decodeFilenameFromHeader } from './utils/decode-filename.util';
import { decodeFileContent } from './utils/decode-file-content.util';

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

    // Декодируем имя файла, которое multer уже извлек из Content-Disposition
    // Multer может неправильно декодировать имя файла, особенно если оно содержит не-ASCII символы
    let decodedFilename = file.originalname;
    try {
      // Пробуем декодировать имя файла
      // Если имя файла выглядит как кракозябры (содержит неправильно закодированные символы),
      // попробуем интерпретировать его как Latin-1 и конвертировать в UTF-8
      decodedFilename = decodeFilename(file.originalname);
      
      // Логируем для отладки
      if (decodedFilename !== file.originalname) {
        console.log(`[Upload] Decoded filename: "${file.originalname}" -> "${decodedFilename}"`);
      }
    } catch (error) {
      console.warn('Failed to decode filename, using original:', file.originalname, error);
      // Используем оригинальное имя файла в случае ошибки
    }

    // Декодируем содержимое файла с автоматическим определением кодировки
    // Поддерживает UTF-8, Windows-1251 и другие кодировки
    const fileContent = decodeFileContent(file.buffer);

    // Обновляем имя файла в объекте file
    file.originalname = decodedFilename;

    const result = await this.uploadService.saveFile(file);

    // Парсим файл и создаем эмбеддинги
    try {
      const fileEntity = await this.filesService.create(decodedFilename);
      
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
          console.log(`[Upload] Creating embeddings for ${texts.length} chunks`);
          const embeddings = await this.embeddingsService.createEmbeddings(texts);
          console.log(`[Upload] Created ${embeddings.length} embeddings`);
          
          if (embeddings.length > 0 && embeddings[0].length > 0) {
            console.log(`[Upload] First embedding length: ${embeddings[0].length}`);
            console.log(`[Upload] First embedding sample (first 5): ${embeddings[0].slice(0, 5).join(', ')}`);
          }
          
          // Добавляем эмбеддинги к чанкам
          const chunksWithEmbeddings = chunks.map((chunk, index) => ({
            ...chunk,
            embedding: embeddings[index],
          }));

          const insertedCount = await this.textChunksService.insertMany(chunksWithEmbeddings);
          console.log(`[Upload] Successfully inserted ${insertedCount} chunks with embeddings`);
        } catch (embeddingError) {
          // Если не удалось создать эмбеддинги, сохраняем чанки без эмбеддингов
          console.error('[Upload] Failed to create embeddings:', embeddingError);
          console.error('[Upload] Error details:', embeddingError instanceof Error ? embeddingError.message : String(embeddingError));
          await this.textChunksService.insertMany(chunks);
        }
      }
    } catch (error) {
      // Ошибка парсинга не прерывает загрузку файла
      console.error('Failed to parse file:', error);
    }

    // Устанавливаем правильные заголовки с кодировкой UTF-8
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(HttpStatus.OK).json(result);
  }


}



