import { Module } from '@nestjs/common';
import { CoreModule } from '../../../core/core.module';
import { SitesService, SITES_REPOSITORY } from './sites.service';
import { SupabaseSitesRepository } from './repositories/supabase-sites.repository';

@Module({
	imports: [CoreModule],
	providers: [
		SitesService,
		{ provide: SITES_REPOSITORY, useClass: SupabaseSitesRepository },
	],
	exports: [SitesService],
})
export class SitesModule {}

