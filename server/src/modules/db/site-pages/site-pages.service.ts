import { Inject, Injectable } from '@nestjs/common';
import { SitePageEntity } from './domain/site-page.entity';
import type { SitePagesRepositoryPort } from './repositories/site-pages.repository.port';

export const SITE_PAGES_REPOSITORY = Symbol('SITE_PAGES_REPOSITORY');

@Injectable()
export class SitePagesService {
	constructor(@Inject(SITE_PAGES_REPOSITORY) private readonly pages: SitePagesRepositoryPort) {}

	insertMany(pages: Array<Omit<SitePageEntity, 'id' | 'crawled_at'>>): Promise<number> {
		return this.pages.insertMany(pages);
	}

	upsertMany(pages: Array<Omit<SitePageEntity, 'id' | 'crawled_at'>>): Promise<number> {
		return this.pages.upsertMany(pages);
	}

	findById(id: string): Promise<SitePageEntity | null> {
		return this.pages.findById(id);
	}

	listBySiteId(siteId: string): Promise<SitePageEntity[]> {
		return this.pages.listBySiteId(siteId);
	}

	findByUrl(siteId: string, url: string): Promise<SitePageEntity | null> {
		return this.pages.findByUrl(siteId, url);
	}

	deleteBySiteId(siteId: string): Promise<void> {
		return this.pages.deleteBySiteId(siteId);
	}

	deleteById(id: string): Promise<void> {
		return this.pages.deleteById(id);
	}
}

