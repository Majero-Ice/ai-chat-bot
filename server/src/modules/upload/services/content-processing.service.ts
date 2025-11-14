import { Injectable, Logger } from '@nestjs/common';
import { ParserService } from '../../parser/parser.service';
import { EmbeddingsService } from '../../ai/embeddings/embeddings.service';
import { TextChunksService } from '../../db/text-chunks/text-chunks.service';
import { FilesService } from '../../db/files/files.service';
import { SitesService } from '../../db/sites/sites.service';
import { SitePagesService } from '../../db/site-pages/site-pages.service';
import type { FileParseResult } from '../../parser/interfaces/parser-result.interface';
import type { CrawlerResult } from '../../crawler/interfaces/crawler-result.interface';

export interface ProcessContentOptions {
  fileName?: string;
  parserType?: 'file' | 'json' | 'crawler';
  skipEmbeddings?: boolean;
  sourceType?: 'file' | 'crawler';
  sourceUrl?: string; // URL для краулера
}

export interface ProcessContentResult {
  fileId?: string; // Для файлов и краулера (всегда создается)
  siteId?: string; // Для краулера
  chunksCount: number;
  embeddingsCount: number;
  pagesCount?: number; // Для краулера
}

/**
 * Сервис для обработки контента: парсинг и создание эмбеддингов
 * Вынесен из контроллера для переиспользования
 */
@Injectable()
export class ContentProcessingService {
  private readonly logger = new Logger(ContentProcessingService.name);

  constructor(
    private readonly parserService: ParserService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly textChunksService: TextChunksService,
    private readonly filesService: FilesService,
    private readonly sitesService: SitesService,
    private readonly sitePagesService: SitePagesService,
  ) {}

  /**
   * Обрабатывает контент: парсит, создает чанки и эмбеддинги
   * @param content Содержимое для обработки
   * @param options Опции обработки
   * @returns Результат обработки
   */
  async processContent(
    content: string,
    options: ProcessContentOptions = {},
  ): Promise<ProcessContentResult> {
    const { 
      fileName = 'untitled', 
      parserType = 'file', 
      skipEmbeddings = false,
      sourceType = 'file',
      sourceUrl,
    } = options;

    this.logger.log(`Processing content: ${fileName}, parser: ${parserType}, source: ${sourceType}`);

    // Если это краулер, обрабатываем по-другому
    if (sourceType === 'crawler' && parserType === 'crawler' && sourceUrl) {
      return this.processCrawlerContent(content, sourceUrl, fileName, skipEmbeddings);
    }

    // Стандартная обработка для файлов
    return this.processFileContent(content, fileName, parserType, skipEmbeddings);
  }

  /**
   * Обрабатывает контент от краулера
   */
  private async processCrawlerContent(
    content: string,
    sourceUrl: string,
    siteName: string,
    skipEmbeddings: boolean,
  ): Promise<ProcessContentResult> {
    // Парсим JSON с результатом краулера
    let crawlerResult: CrawlerResult;
    try {
      crawlerResult = JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to parse crawler result: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (!crawlerResult.pages || crawlerResult.pages.length === 0) {
      this.logger.warn(`No pages found in crawler result for ${sourceUrl}`);
      return {
        chunksCount: 0,
        embeddingsCount: 0,
        pagesCount: 0,
      };
    }

    // Создаем или находим сайт
    const siteEntity = await this.sitesService.findOrCreate(sourceUrl, siteName);
    this.logger.log(`Site created/found: ${siteEntity.id} for ${sourceUrl}`);

    // Сохраняем страницы (используем upsert для избежания дубликатов)
    const pages = crawlerResult.pages.map((page) => ({
      site_id: siteEntity.id,
      url: page.url,
      title: page.title || page.url,
      content: page.content,
    }));

    const pagesCount = await this.sitePagesService.upsertMany(pages);
    this.logger.log(`Saved/updated ${pagesCount} pages for site ${siteEntity.id}`);

    // Создаем запись в files для совместимости с text_chunks (foreign key constraint)
    // Используем имя сайта как имя файла
    const fileEntity = await this.filesService.create(siteName || siteEntity.name);
    this.logger.log(`Created file record ${fileEntity.id} for site ${siteEntity.id}`);

    // Парсим контент всех страниц
    const parseResult = await this.parserService.parse('crawler', content);
    
    if (!parseResult.chunks || parseResult.chunks.length === 0) {
      this.logger.warn(`No chunks found for site ${siteEntity.id}`);
      return {
        siteId: siteEntity.id,
        fileId: fileEntity.id,
        chunksCount: 0,
        embeddingsCount: 0,
        pagesCount,
      };
    }

    // Подготавливаем чанки с привязкой к файлу (который связан с сайтом)
    const chunks = parseResult.chunks.map((chunk) => ({
      file_id: fileEntity.id, // Используем file_id для соблюдения foreign key constraint
      chunk_index: chunk.index,
      text: chunk.content,
    }));

    this.logger.log(`Parsed ${chunks.length} chunks for site ${siteEntity.id}`);

    // Создаем эмбеддинги
    let embeddingsCount = 0;
    if (!skipEmbeddings) {
      try {
        const texts = chunks.map((chunk) => chunk.text);
        this.logger.log(`Creating embeddings for ${texts.length} chunks`);
        const embeddings = await this.embeddingsService.createEmbeddings(texts);
        this.logger.log(`Created ${embeddings.length} embeddings`);

        if (embeddings.length > 0 && embeddings[0].length > 0) {
          const chunksWithEmbeddings = chunks.map((chunk, index) => ({
            ...chunk,
            embedding: embeddings[index],
          }));

          const insertedCount = await this.textChunksService.insertMany(chunksWithEmbeddings);
          embeddingsCount = insertedCount;
          this.logger.log(`Successfully inserted ${insertedCount} chunks with embeddings`);
        } else {
          await this.textChunksService.insertMany(chunks);
          this.logger.warn('Embeddings are empty, saved chunks without embeddings');
        }
      } catch (embeddingError) {
        this.logger.error(`Failed to create embeddings: ${embeddingError instanceof Error ? embeddingError.message : String(embeddingError)}`);
        await this.textChunksService.insertMany(chunks);
        this.logger.log('Saved chunks without embeddings');
      }
    } else {
      await this.textChunksService.insertMany(chunks);
      this.logger.log('Saved chunks without embeddings (skipped)');
    }

    return {
      siteId: siteEntity.id,
      fileId: fileEntity.id,
      chunksCount: chunks.length,
      embeddingsCount,
      pagesCount,
    };
  }

  /**
   * Обрабатывает контент файла
   */
  private async processFileContent(
    content: string,
    fileName: string,
    parserType: 'file' | 'json' | 'crawler',
    skipEmbeddings: boolean,
  ): Promise<ProcessContentResult> {
    // Создаем запись о файле
    const fileEntity = await this.filesService.create(fileName);

    // Парсим контент
    const parseResult = await this.parserService.parse(parserType, content);
    
    if (!parseResult.chunks || parseResult.chunks.length === 0) {
      this.logger.warn(`No chunks found for ${fileName}`);
      return {
        fileId: fileEntity.id,
        chunksCount: 0,
        embeddingsCount: 0,
      };
    }

    // Подготавливаем чанки
    const chunks = parseResult.chunks.map((chunk) => ({
      file_id: fileEntity.id,
      chunk_index: chunk.index,
      text: chunk.content,
    }));

    this.logger.log(`Parsed ${chunks.length} chunks for ${fileName}`);

    // Создаем эмбеддинги
    let embeddingsCount = 0;
    if (!skipEmbeddings) {
      try {
        const texts = chunks.map((chunk) => chunk.text);
        this.logger.log(`Creating embeddings for ${texts.length} chunks`);
        const embeddings = await this.embeddingsService.createEmbeddings(texts);
        this.logger.log(`Created ${embeddings.length} embeddings`);

        if (embeddings.length > 0 && embeddings[0].length > 0) {
          const chunksWithEmbeddings = chunks.map((chunk, index) => ({
            ...chunk,
            embedding: embeddings[index],
          }));

          const insertedCount = await this.textChunksService.insertMany(chunksWithEmbeddings);
          embeddingsCount = insertedCount;
          this.logger.log(`Successfully inserted ${insertedCount} chunks with embeddings`);
        } else {
          await this.textChunksService.insertMany(chunks);
          this.logger.warn('Embeddings are empty, saved chunks without embeddings');
        }
      } catch (embeddingError) {
        this.logger.error(`Failed to create embeddings: ${embeddingError instanceof Error ? embeddingError.message : String(embeddingError)}`);
        await this.textChunksService.insertMany(chunks);
        this.logger.log('Saved chunks without embeddings');
      }
    } else {
      await this.textChunksService.insertMany(chunks);
      this.logger.log('Saved chunks without embeddings (skipped)');
    }

    return {
      fileId: fileEntity.id,
      chunksCount: chunks.length,
      embeddingsCount,
    };
  }
}

