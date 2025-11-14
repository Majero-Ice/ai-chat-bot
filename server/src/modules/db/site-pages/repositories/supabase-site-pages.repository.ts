import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../../core/supabase/base.repository';
import { SitePageEntity } from '../domain/site-page.entity';
import { SitePagesRepositoryPort } from './site-pages.repository.port';

@Injectable()
export class SupabaseSitePagesRepository extends BaseRepository<SitePageEntity> implements SitePagesRepositoryPort {
	protected readonly table = 'site_pages';

	async insertMany(pages: Array<Omit<SitePageEntity, 'id' | 'crawled_at'>>): Promise<number> {
		if (pages.length === 0) return 0;
		
		const { count, error } = await this.from().insert(pages, { count: 'exact' });
		if (error) throw error;
		return count ?? 0;
	}

	async upsertMany(pages: Array<Omit<SitePageEntity, 'id' | 'crawled_at'>>): Promise<number> {
		if (pages.length === 0) return 0;
		
		// Используем upsert с конфликтным разрешением по (site_id, url)
		const { count, error } = await this.from()
			.upsert(pages, { 
				onConflict: 'site_id,url',
				count: 'exact',
			});
		if (error) throw error;
		return count ?? 0;
	}

	async findById(id: string): Promise<SitePageEntity | null> {
		const { data, error } = await this.from().select('*').eq('id', id).maybeSingle();
		if (error) throw error;
		return data as SitePageEntity | null;
	}

	async listBySiteId(siteId: string): Promise<SitePageEntity[]> {
		const { data, error } = await this.from()
			.select('*')
			.eq('site_id', siteId)
			.order('crawled_at', { ascending: false });
		if (error) throw error;
		return (data ?? []) as SitePageEntity[];
	}

	async findByUrl(siteId: string, url: string): Promise<SitePageEntity | null> {
		const { data, error } = await this.from()
			.select('*')
			.eq('site_id', siteId)
			.eq('url', url)
			.maybeSingle();
		if (error) throw error;
		return data as SitePageEntity | null;
	}

	async deleteBySiteId(siteId: string): Promise<void> {
		const { error } = await this.from().delete().eq('site_id', siteId);
		if (error) throw error;
	}

	async deleteById(id: string): Promise<void> {
		const { error } = await this.from().delete().eq('id', id);
		if (error) throw error;
	}
}

