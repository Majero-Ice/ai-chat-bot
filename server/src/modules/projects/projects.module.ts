import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsModule as DbProjectsModule } from '../db/projects/projects.module';
import { AuthModule } from '../auth/auth.module';

@Module({
	imports: [DbProjectsModule, AuthModule],
	controllers: [ProjectsController],
})
export class ProjectsModule {}
