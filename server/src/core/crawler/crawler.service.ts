import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { chromium } from 'playwright';
import type { Browser, BrowserContext } from 'playwright';
import { CRAWLER_BROWSER } from './crawler.constants';
import { AntiDetectService } from './anti-detect.service';

/**
 * Основной сервис для работы с браузером Playwright
 * Управляет жизненным циклом браузера и предоставляет доступ к нему
 */
@Injectable()
export class CrawlerService implements OnModuleDestroy {
	private readonly logger = new Logger(CrawlerService.name);

	constructor(
		@Inject(CRAWLER_BROWSER) private readonly browser: Browser,
		private readonly antiDetectService: AntiDetectService,
	) {}

	/**
	 * Возвращает экземпляр браузера Playwright
	 */
	getBrowser(): Browser {
		return this.browser;
	}

	/**
	 * Создает новый контекст браузера для обхода с улучшенными настройками для обхода защиты
	 */
	async createContext(): Promise<BrowserContext> {
		// Генерируем случайный user-agent из списка популярных браузеров
		const userAgents = [
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
			'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
		];
		const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

		const context = await this.browser.newContext({
			userAgent: randomUserAgent,
			viewport: {
				width: 1920 + Math.floor(Math.random() * 100),
				height: 1080 + Math.floor(Math.random() * 100),
			},
			locale: 'en-US',
			timezoneId: 'America/New_York',
			// Эмулируем реального пользователя
			permissions: ['geolocation'],
			geolocation: { longitude: -74.006, latitude: 40.7128 },
			// Отключаем автоматизацию флаги
			extraHTTPHeaders: {
				'Accept-Language': 'en-US,en;q=0.9',
				'Accept-Encoding': 'gzip, deflate, br',
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
				'Connection': 'keep-alive',
				'Upgrade-Insecure-Requests': '1',
				'Sec-Fetch-Dest': 'document',
				'Sec-Fetch-Mode': 'navigate',
				'Sec-Fetch-Site': 'none',
				'Sec-Fetch-User': '?1',
			},
		});

		// Применяем анти-детект техники к контексту
		// Создаем временную страницу для применения скриптов
		const tempPage = await context.newPage();
		await this.antiDetectService.applyAllProtections(tempPage);
		await tempPage.close();

		return context;
	}

	/**
	 * Закрывает браузер при завершении работы модуля
	 */
	async onModuleDestroy() {
		this.logger.log('Closing Playwright browser...');
		await this.browser.close();
	}
}

