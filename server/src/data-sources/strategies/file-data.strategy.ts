import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSourceStrategy } from '../interfaces/data-source.interface';
import { UploadService } from '../../upload/upload.service';

@Injectable()
export class FileDataStrategy implements DataSourceStrategy {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Получает данные из файла
   * @param source - путь к файлу или имя файла в директории uploads
   */
  async getData(source: string): Promise<string> {
    try {
      // Если source - это полный путь, используем его
      // Если это только имя файла, получаем полный путь
      let filePath: string;
      
      if (source.includes('/') || source.includes('\\')) {
        filePath = source;
      } else {
        filePath = this.uploadService.getFilePath(source);
      }

      // Проверяем существование файла
      if (!this.uploadService.fileExists(filePath)) {
        throw new BadRequestException(`File not found: ${filePath}`);
      }

      // Читаем содержимое текстового файла
      const content = await this.uploadService.readTextFile(filePath);
      
      return content;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to read file: ${error.message}`);
    }
  }
}

