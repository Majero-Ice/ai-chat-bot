import { Module } from '@nestjs/common';
import { CoreModule } from '../../../core/core.module';
import { SitePagesService, SITE_PAGES_REPOSITORY } from './site-pages.service';
import { SupabaseSitePagesRepository } from './repositories/supabase-site-pages.repository';

@Module({
	imports: [CoreModule],
	providers: [
		SitePagesService,
		{ provide: SITE_PAGES_REPOSITORY, useClass: SupabaseSitePagesRepository },
	],
	exports: [SitePagesService],
})
export class SitePagesModule {}

