import { Inject, Injectable } from '@nestjs/common';
import { SiteEntity } from './domain/site.entity';
import type { SitesRepositoryPort } from './repositories/sites.repository.port';

export const SITES_REPOSITORY = Symbol('SITES_REPOSITORY');

@Injectable()
export class SitesService {
	constructor(@Inject(SITES_REPOSITORY) private readonly sites: SitesRepositoryPort) {}

	create(url: string, name?: string): Promise<SiteEntity> {
		const siteName = name || this.extractSiteName(url);
		return this.sites.create({ url, name: siteName });
	}

	findById(id: string): Promise<SiteEntity | null> {
		return this.sites.findById(id);
	}

	findByUrl(url: string): Promise<SiteEntity | null> {
		return this.sites.findByUrl(url);
	}

	async findOrCreate(url: string, name?: string): Promise<SiteEntity> {
		const existing = await this.sites.findByUrl(url);
		if (existing) {
			return existing;
		}
		return this.create(url, name);
	}

	list(): Promise<SiteEntity[]> {
		return this.sites.list();
	}

	deleteById(id: string): Promise<void> {
		return this.sites.deleteById(id);
	}

	private extractSiteName(url: string): string {
		try {
			const urlObj = new URL(url);
			return urlObj.hostname.replace('www.', '');
		} catch {
			return url;
		}
	}
}

