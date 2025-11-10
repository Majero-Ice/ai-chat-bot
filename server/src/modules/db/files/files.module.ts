import { Module } from '@nestjs/common';
import { FilesService, FILES_REPOSITORY } from './files.service';
import { SupabaseFilesRepository } from './repositories/supabase-files.repository';
import { CoreModule } from '../../../core/core.module';

@Module({
	imports: [CoreModule],
	providers: [
		FilesService,
		{ provide: FILES_REPOSITORY, useClass: SupabaseFilesRepository },
	],
	exports: [FilesService],
})
export class FilesModule {}

