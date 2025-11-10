import { Injectable, BadRequestException } from '@nestjs/common';
import { FileUploadResult, UploadedFile } from './interfaces/upload-file.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File): Promise<FileUploadResult> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const fileExtension = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;
    const filePath = path.join(this.uploadDir, fileName);

    fs.writeFileSync(filePath, file.buffer);

    const uploadedFile: UploadedFile = {
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      size: file.size,
      destination: this.uploadDir,
      filename: fileName,
      path: filePath,
    };

    return {
      file: uploadedFile,
      filePath,
    };
  }

  getFilePath(filename: string): string {
    return path.join(this.uploadDir, filename);
  }

  fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  async readTextFile(filePath: string): Promise<string> {
    if (!this.fileExists(filePath)) {
      throw new BadRequestException(`File not found: ${filePath}`);
    }
    return fs.promises.readFile(filePath, 'utf-8');
  }

  async deleteFile(filePath: string): Promise<void> {
    if (this.fileExists(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  getFileInfo(filePath: string): UploadedFile | null {
    if (!this.fileExists(filePath)) {
      return null;
    }
    const stats = fs.statSync(filePath);
    const filename = path.basename(filePath);
    return {
      fieldname: 'file',
      originalname: filename,
      encoding: 'utf-8',
      mimetype: 'text/plain',
      size: stats.size,
      destination: path.dirname(filePath),
      filename,
      path: filePath,
    };
  }
}


