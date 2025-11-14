import { SitePageEntity } from '../domain/site-page.entity';

export interface SitePagesRepositoryPort {
	insertMany(pages: Array<Omit<SitePageEntity, 'id' | 'crawled_at'>>): Promise<number>;
	upsertMany(pages: Array<Omit<SitePageEntity, 'id' | 'crawled_at'>>): Promise<number>;
	findById(id: string): Promise<SitePageEntity | null>;
	listBySiteId(siteId: string): Promise<SitePageEntity[]>;
	findByUrl(siteId: string, url: string): Promise<SitePageEntity | null>;
	deleteBySiteId(siteId: string): Promise<void>;
	deleteById(id: string): Promise<void>;
}

