import { SiteEntity } from '../domain/site.entity';

export interface SitesRepositoryPort {
	create(input: Pick<SiteEntity, 'url' | 'name'>): Promise<SiteEntity>;
	findById(id: string): Promise<SiteEntity | null>;
	findByUrl(url: string): Promise<SiteEntity | null>;
	list(): Promise<SiteEntity[]>;
	deleteById(id: string): Promise<void>;
}

