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
import { memoryStorage } from 'multer';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

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

    return this.uploadService.saveFile(file);
  }
}

