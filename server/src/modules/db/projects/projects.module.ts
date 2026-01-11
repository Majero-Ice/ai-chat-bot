import { Module } from '@nestjs/common';
import { ProjectsService, PROJECTS_REPOSITORY } from './projects.service';
import { SupabaseProjectsRepository } from './repositories/supabase-projects.repository';
import { CoreModule } from '../../../core/core.module';

@Module({
	imports: [CoreModule],
	providers: [
		ProjectsService,
		{ provide: PROJECTS_REPOSITORY, useClass: SupabaseProjectsRepository },
	],
	exports: [ProjectsService],
})
export class ProjectsModule {}
