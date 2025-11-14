import { Inject, Injectable, Logger } from '@nestjs/common';
import { BrowserContext, Page } from 'playwright';
import { CrawlerOptions } from './interfaces/crawler-options.interface';
import { CrawlerResult, CrawledPage, CrawlerError } from './interfaces/crawler-result.interface';
import { CrawlerService as CoreCrawlerService } from '../../core/crawler/crawler.service';
import { URL } from 'url';

@Injectable()
export class WebCrawlerService {
  private readonly logger = new Logger(WebCrawlerService.name);
  private readonly defaultOptions: Required<CrawlerOptions> = {
    maxDepth: 2,
    maxPages: 50,
    timeout: 60000, // Увеличено до 60 секунд
    waitForContent: 3000, // Увеличено до 3 секунд
    contentSelector: 'body',
    sameDomainOnly: true,
    excludePatterns: [],
    includePatterns: [],
  };

  constructor(@Inject(CoreCrawlerService) private readonly coreCrawlerService: CoreCrawlerService) {}

  /**
   * Обходит сайт, начиная с указанного URL, и извлекает контент со страниц
   * @param startUrl Начальный URL для обхода
   * @param options Опции для краулера
   * @returns Результат обхода с массивом страниц и ошибок
   */
  async crawl(startUrl: string, options: CrawlerOptions = {}): Promise<CrawlerResult> {
    const opts = { ...this.defaultOptions, ...options };
    const visitedUrls = new Set<string>();
    const pages: CrawledPage[] = [];
    const errors: CrawlerError[] = [];
    let context: BrowserContext | null = null;

    try {
      // Нормализуем начальный URL
      const baseUrl = this.normalizeUrl(startUrl);
      if (!baseUrl) {
        throw new Error(`Invalid start URL: ${startUrl}`);
      }
      const baseUrlObj = new URL(baseUrl);
      // Нормализуем домен (убираем www для консистентности)
      const baseDomain = baseUrlObj.hostname.replace(/^www\./, '');
      this.logger.log(`Starting crawl from ${baseUrl} (base domain: ${baseDomain})`);

      // Создаем контекст браузера из core сервиса
      context = await this.coreCrawlerService.createContext();

      if (!context) {
        throw new Error('Failed to create browser context');
      }

      // Обходим сайт
      await this.crawlRecursive(
        context,
        baseUrl,
        baseDomain,
        visitedUrls,
        pages,
        errors,
        opts,
        0,
      );

      this.logger.log(`Crawl completed: ${pages.length} pages, ${errors.length} errors`);

      return {
        pages,
        totalPages: pages.length,
        errors,
      };
    } catch (error) {
      this.logger.error(`Crawl failed: ${error.message}`, error.stack);
      throw error;
    } finally {
      if (context) {
        await context.close();
      }
    }
  }

  /**
   * Рекурсивно обходит страницы сайта
   */
  private async crawlRecursive(
    context: BrowserContext,
    url: string,
    baseDomain: string,
    visitedUrls: Set<string>,
    pages: CrawledPage[],
    errors: CrawlerError[],
    options: Required<CrawlerOptions>,
    depth: number,
  ): Promise<void> {
    // Проверяем ограничения
    if (depth > options.maxDepth || pages.length >= options.maxPages) {
      return;
    }

    // Нормализуем URL
    const normalizedUrl = this.normalizeUrl(url, baseDomain);
    if (!normalizedUrl) {
      this.logger.debug(`Failed to normalize URL: ${url}`);
      return;
    }

    // Проверяем, не посещали ли мы уже этот URL
    if (visitedUrls.has(normalizedUrl)) {
      this.logger.debug(`Already visited: ${normalizedUrl} (skipping)`);
      return;
    }

    // Проверяем фильтры
    if (!this.shouldCrawlUrl(normalizedUrl, baseDomain, options)) {
      this.logger.debug(`URL filtered out: ${normalizedUrl}`);
      return;
    }

    visitedUrls.add(normalizedUrl);
    this.logger.debug(`Added to visited: ${normalizedUrl} (total visited: ${visitedUrls.size})`);

    let page: Page | null = null;
    try {
      this.logger.debug(`Crawling: ${normalizedUrl} (depth: ${depth})`);

      page = await context.newPage();
      
      // Пробуем загрузить страницу с разными стратегиями ожидания
      // Начинаем с более мягких стратегий для сайтов с долгой загрузкой
      let pageLoaded = false;
      let lastError: Error | null = null;
      const waitStrategies: Array<'load' | 'domcontentloaded' | 'networkidle'> = ['domcontentloaded', 'load', 'networkidle'];
      
      for (const waitStrategy of waitStrategies) {
        try {
          await page.goto(normalizedUrl, {
            waitUntil: waitStrategy,
            timeout: options.timeout,
          });
          pageLoaded = true;
          this.logger.debug(`Page loaded using ${waitStrategy} strategy`);
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          // Если не получилось с этой стратегией, пробуем следующую
          if (waitStrategy !== waitStrategies[waitStrategies.length - 1]) {
            this.logger.debug(`Failed to load with ${waitStrategy}, trying next strategy...`);
            continue;
          }
        }
      }

      // Если все стратегии не сработали, пробуем загрузить с минимальным ожиданием
      if (!pageLoaded) {
        try {
          this.logger.debug('Trying to load page with minimal wait...');
          await page.goto(normalizedUrl, {
            waitUntil: 'domcontentloaded',
            timeout: Math.min(options.timeout, 10000), // Уменьшаем таймаут для fallback
          });
          pageLoaded = true;
          this.logger.debug('Page loaded with minimal wait (fallback)');
        } catch (fallbackError) {
          // Если и это не сработало, пробуем просто дождаться появления body
          try {
            this.logger.debug('Waiting for body element to appear...');
            await page.goto(normalizedUrl, { timeout: 5000 });
            await page.waitForSelector('body', { timeout: 5000 });
            pageLoaded = true;
            this.logger.debug('Page body appeared (last resort)');
          } catch (finalError) {
            throw lastError || finalError;
          }
        }
      }

      // Ждем загрузки контента (для JavaScript-приложений)
      await page.waitForTimeout(options.waitForContent);
      
      // Дополнительно ждем появления ссылок (для SPA и динамических сайтов)
      // Пробуем несколько раз, так как контент может загружаться постепенно
      let linksFound = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const linkCount = await page.evaluate(() => {
            return document.querySelectorAll('a[href]').length;
          });
          
          if (linkCount > 0) {
            linksFound = true;
            this.logger.debug(`Found ${linkCount} links after attempt ${attempt + 1}`);
            break;
          }
          
          // Ждем еще немного перед следующей попыткой
          if (attempt < 2) {
            await page.waitForTimeout(2000);
          }
        } catch (e) {
          // Игнорируем ошибки
        }
      }
      
      if (!linksFound) {
        this.logger.debug('No links found after waiting, trying to extract anyway');
      }

      // Извлекаем контент
      const title = await page.title();
      const content = await this.extractContent(page, options.contentSelector);

      if (content && content.trim().length > 0) {
        pages.push({
          url: normalizedUrl,
          title: title || normalizedUrl,
          content: content.trim(),
          timestamp: new Date(),
        });
      }

      // Если не достигли максимальной глубины, ищем ссылки
      if (depth < options.maxDepth && pages.length < options.maxPages) {
        const links = await this.extractLinks(page, baseDomain, options, normalizedUrl);
        this.logger.log(`Found ${links.length} links on ${normalizedUrl} (depth: ${depth}, pages so far: ${pages.length})`);
        
        if (links.length > 0) {
          this.logger.debug(`First few links: ${links.slice(0, 5).join(', ')}`);
        }
        
        let processedCount = 0;
        let skippedCount = 0;
        
        for (const link of links) {
          if (pages.length >= options.maxPages) {
            this.logger.log(`Reached max pages limit (${options.maxPages}), stopping crawl`);
            break;
          }
          
          // Проверяем, нужно ли обходить эту ссылку
          const normalizedLink = this.normalizeUrl(link, baseDomain);
          if (!normalizedLink) {
            this.logger.debug(`Skipping invalid link: ${link}`);
            skippedCount++;
            continue;
          }
          
          if (!this.shouldCrawlUrl(normalizedLink, baseDomain, options)) {
            this.logger.debug(`Skipping link (filtered): ${normalizedLink}`);
            skippedCount++;
            continue;
          }
          
          if (visitedUrls.has(normalizedLink)) {
            this.logger.debug(`Skipping already visited link: ${normalizedLink}`);
            skippedCount++;
            continue;
          }
          
          this.logger.log(`[${depth + 1}/${options.maxDepth}] Following link: ${normalizedLink} (visited: ${visitedUrls.size})`);
          processedCount++;
          await this.crawlRecursive(
            context,
            normalizedLink,
            baseDomain,
            visitedUrls,
            pages,
            errors,
            options,
            depth + 1,
          );
        }
        
        this.logger.log(
          `Link processing summary for ${normalizedUrl}: ` +
          `total=${links.length}, processed=${processedCount}, skipped=${skippedCount}, ` +
          `pages after=${pages.length}, visited=${visitedUrls.size}`
        );
      } else {
        if (depth >= options.maxDepth) {
          this.logger.debug(`Reached max depth (${options.maxDepth}), not extracting links`);
        }
        if (pages.length >= options.maxPages) {
          this.logger.debug(`Reached max pages (${options.maxPages}), not extracting links`);
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to crawl ${normalizedUrl}: ${error.message}`);
      errors.push({
        url: normalizedUrl,
        error: error.message,
        timestamp: new Date(),
      });
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  /**
   * Извлекает текстовый контент со страницы
   */
  private async extractContent(page: Page, selector: string): Promise<string> {
    try {
      // Удаляем скрипты и стили
      await page.evaluate(() => {
        const scripts = document.querySelectorAll('script, style, noscript, iframe');
        scripts.forEach((el) => el.remove());
      });

      // Извлекаем текст из указанного селектора
      const content = await page.evaluate((sel) => {
        const element = document.querySelector(sel);
        if (!element) {
          return (document.body as HTMLElement).innerText || '';
        }
        return (element as HTMLElement).innerText || '';
      }, selector);

      return content;
    } catch (error) {
      this.logger.warn(`Failed to extract content: ${error.message}`);
      return '';
    }
  }

  /**
   * Извлекает ссылки со страницы
   */
  private async extractLinks(
    page: Page,
    baseDomain: string,
    options: Required<CrawlerOptions>,
    currentUrl: string,
  ): Promise<string[]> {
    try {
      // Извлекаем только href атрибуты в браузере, всю обработку делаем в Node.js
      const hrefs = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        return anchors.map((anchor) => anchor.getAttribute('href')).filter((href) => href !== null) as string[];
      });

      this.logger.debug(`Total <a[href]> elements found: ${hrefs.length}`);

      const urls = new Set<string>();
      let skippedCount = 0;
      let domainMismatchCount = 0;
      let invalidUrlCount = 0;
      const invalidExamples: string[] = [];

      // Вычисляем origin текущего URL
      let currentOrigin: string;
      try {
        const currentUrlObj = new URL(currentUrl);
        currentOrigin = currentUrlObj.origin;
      } catch {
        currentOrigin = '';
      }

      // Обрабатываем каждый href в Node.js
      for (const href of hrefs) {
        if (!href || href.trim() === '') {
          skippedCount++;
          continue;
        }

        try {
          // Преобразуем относительные URL в абсолютные
          let absoluteUrl: string;
          try {
            absoluteUrl = new URL(href, currentUrl).href;
          } catch (urlError) {
            // Если не получилось создать URL, пробуем как относительный путь
            if (href.startsWith('/')) {
              absoluteUrl = new URL(href, currentUrl).href;
            } else if (href.startsWith('./') || href.startsWith('../')) {
              absoluteUrl = new URL(href, currentUrl).href;
            } else {
              // Для относительных путей без префикса
              absoluteUrl = new URL(href, currentUrl).href;
            }
          }

          // Проверяем домен
          if (options.sameDomainOnly) {
            const urlDomain = new URL(absoluteUrl).hostname;
            // Нормализуем домены (www и без www считаем одинаковыми)
            const normalizeDomain = (d: string) => d.replace(/^www\./, '');
            if (normalizeDomain(urlDomain) !== normalizeDomain(baseDomain)) {
              domainMismatchCount++;
              continue;
            }
          }

          // Исключаем якоря и javascript: ссылки
          if (
            absoluteUrl.startsWith('javascript:') ||
            absoluteUrl.startsWith('mailto:') ||
            absoluteUrl.startsWith('tel:') ||
            absoluteUrl.startsWith('data:') ||
            absoluteUrl.startsWith('file:')
          ) {
            skippedCount++;
            continue;
          }

          // Убираем якоря из URL
          const urlWithoutHash = absoluteUrl.split('#')[0];

          // Исключаем пустые URL или только с протоколом
          // Проверяем, что URL не равен просто origin + '/'
          const originWithSlash = currentOrigin + '/';
          if (urlWithoutHash && urlWithoutHash !== originWithSlash && urlWithoutHash !== currentUrl) {
            urls.add(urlWithoutHash);
          } else {
            skippedCount++;
          }
        } catch (e) {
          invalidUrlCount++;
          // Сохраняем примеры невалидных URL для отладки
          if (invalidExamples.length < 5) {
            const errorMsg = e instanceof Error ? e.message : String(e);
            invalidExamples.push(`${href} -> ${errorMsg}`);
          }
        }
      }

      this.logger.debug(
        `Link extraction stats: total=${hrefs.length}, valid=${urls.size}, ` +
        `skipped=${skippedCount}, domainMismatch=${domainMismatchCount}, invalid=${invalidUrlCount}`
      );

      if (invalidUrlCount > 0 && invalidExamples.length > 0) {
        this.logger.debug(`Invalid URL examples: ${invalidExamples.join('; ')}`);
      }

      return Array.from(urls);
    } catch (error) {
      this.logger.warn(`Failed to extract links: ${error.message}`);
      return [];
    }
  }

  /**
   * Нормализует URL
   */
  private normalizeUrl(url: string, baseDomain?: string): string | null {
    try {
      // Если URL относительный и есть базовый домен
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        if (baseDomain) {
          url = `https://${baseDomain}${url.startsWith('/') ? url : '/' + url}`;
        } else {
          return null;
        }
      }

      const urlObj = new URL(url);
      // Убираем якоря и query параметры для нормализации
      urlObj.hash = '';
      // Оставляем query параметры, но сортируем их для нормализации
      urlObj.searchParams.sort();

      return urlObj.href;
    } catch (error) {
      return null;
    }
  }

  /**
   * Проверяет, нужно ли обходить указанный URL
   */
  private shouldCrawlUrl(
    url: string,
    baseDomain: string,
    options: Required<CrawlerOptions>,
  ): boolean {
    try {
      const urlObj = new URL(url);

      // Нормализуем домены (www и без www считаем одинаковыми)
      const normalizeDomain = (d: string) => d.replace(/^www\./, '');

      // Проверяем домен
      if (options.sameDomainOnly && normalizeDomain(urlObj.hostname) !== normalizeDomain(baseDomain)) {
        return false;
      }

      // Проверяем паттерны исключения
      if (options.excludePatterns.length > 0) {
        for (const pattern of options.excludePatterns) {
          if (url.includes(pattern)) {
            return false;
          }
        }
      }

      // Проверяем паттерны включения
      if (options.includePatterns.length > 0) {
        const matches = options.includePatterns.some((pattern) => url.includes(pattern));
        if (!matches) {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}

