import { DynamicModule, Global, Module } from '@nestjs/common';
import { CRAWLER_BROWSER } from './crawler.constants';
import { CrawlerService } from './crawler.service';
import { chromium } from 'playwright';
import type { Browser } from 'playwright';

@Global()
@Module({})
export class CrawlerModule {
	/**
	 * Инициализирует модуль краулера с браузером Playwright
	 */
	static forRootAsync(): DynamicModule {
		const browserProvider = {
			provide: CRAWLER_BROWSER,
			useFactory: async (): Promise<Browser> => {
				return chromium.launch({
					headless: true,
				});
			},
		};

		return {
			module: CrawlerModule,
			providers: [browserProvider, CrawlerService],
			exports: [CRAWLER_BROWSER, CrawlerService],
		};
	}
}

