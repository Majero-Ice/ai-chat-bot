import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { chromium } from 'playwright';
import type { Browser } from 'playwright';
import { CRAWLER_BROWSER } from './crawler.constants';

/**
 * Основной сервис для работы с браузером Playwright
 * Управляет жизненным циклом браузера и предоставляет доступ к нему
 */
@Injectable()
export class CrawlerService implements OnModuleDestroy {
	private readonly logger = new Logger(CrawlerService.name);

	constructor(@Inject(CRAWLER_BROWSER) private readonly browser: Browser) {}

	/**
	 * Возвращает экземпляр браузера Playwright
	 */
	getBrowser(): Browser {
		return this.browser;
	}

	/**
	 * Создает новый контекст браузера для обхода
	 */
	async createContext() {
		return this.browser.newContext({
			userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
		});
	}

	/**
	 * Закрывает браузер при завершении работы модуля
	 */
	async onModuleDestroy() {
		this.logger.log('Closing Playwright browser...');
		await this.browser.close();
	}
}

