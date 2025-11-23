import { DynamicModule, Global, Module } from '@nestjs/common';
import { CRAWLER_BROWSER } from './crawler.constants';
import { CrawlerService } from './crawler.service';
import { AntiDetectService } from './anti-detect.service';
import { chromium } from 'playwright';
import type { Browser } from 'playwright';

@Global()
@Module({})
export class CrawlerModule {
	/**
	 * Инициализирует модуль краулера с браузером Playwright
	 * Использует улучшенные настройки для обхода защиты от ботов
	 */
	static forRootAsync(): DynamicModule {
		const browserProvider = {
			provide: CRAWLER_BROWSER,
			useFactory: async (): Promise<Browser> => {
				return chromium.launch({
					headless: true,
					args: [
						// Отключаем флаги автоматизации
						'--disable-blink-features=AutomationControlled',
						'--disable-dev-shm-usage',
						'--no-sandbox',
						'--disable-setuid-sandbox',
						// Улучшаем скрытность
						'--disable-web-security',
						'--disable-features=IsolateOrigins,site-per-process',
						'--disable-infobars',
						'--disable-notifications',
						'--disable-popup-blocking',
						// Эмулируем реальный браузер
						'--lang=en-US,en',
						'--window-size=1920,1080',
					],
				});
			},
		};

		return {
			module: CrawlerModule,
			providers: [browserProvider, CrawlerService, AntiDetectService],
			exports: [CRAWLER_BROWSER, CrawlerService, AntiDetectService],
		};
	}
}

