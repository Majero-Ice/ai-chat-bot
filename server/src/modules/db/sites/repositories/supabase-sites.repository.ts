import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../../core/supabase/base.repository';
import { SiteEntity } from '../domain/site.entity';
import { SitesRepositoryPort } from './sites.repository.port';

@Injectable()
export class SupabaseSitesRepository extends BaseRepository<SiteEntity> implements SitesRepositoryPort {
	protected readonly table = 'sites';

	async create(site: Pick<SiteEntity, 'url' | 'name'>): Promise<SiteEntity> {
		const { data, error } = await this.from().insert({ url: site.url, name: site.name }).select('*').single();
		if (error) throw error;
		return data as SiteEntity;
	}

	async findById(id: string): Promise<SiteEntity | null> {
		const { data, error } = await this.from().select('*').eq('id', id).maybeSingle();
		if (error) throw error;
		return data as SiteEntity | null;
	}

	async findByUrl(url: string): Promise<SiteEntity | null> {
		const { data, error } = await this.from().select('*').eq('url', url).maybeSingle();
		if (error) throw error;
		return data as SiteEntity | null;
	}

	async list(): Promise<SiteEntity[]> {
		const { data, error } = await this.from().select('*').order('created_at', { ascending: false });
		if (error) throw error;
		return (data ?? []) as SiteEntity[];
	}

	async deleteById(id: string): Promise<void> {
		const { error } = await this.from().delete().eq('id', id);
		if (error) throw error;
	}
}

