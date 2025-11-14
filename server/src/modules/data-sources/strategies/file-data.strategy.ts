import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSourceStrategy } from '../interfaces/data-source.interface';
import { UploadService } from '../../upload/upload.service';

@Injectable()
export class FileDataStrategy implements DataSourceStrategy {
  constructor(private readonly uploadService: UploadService) {}

  async getData(source: string, options?: any): Promise<string> {
    try {
      let filePath: string;
      if (source.includes('/') || source.includes('\\')) {
        filePath = source;
      } else {
        filePath = this.uploadService.getFilePath(source);
      }
      if (!this.uploadService.fileExists(filePath)) {
        throw new BadRequestException(`File not found: ${filePath}`);
      }
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


