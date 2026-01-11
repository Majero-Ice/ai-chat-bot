import { ProjectEntity } from '../domain/project.entity';

export interface ProjectsRepositoryPort {
	create(input: Pick<ProjectEntity, 'name' | 'description' | 'user_id' | 'slug'>): Promise<ProjectEntity>;
	findById(id: string): Promise<ProjectEntity | null>;
	findByUserId(userId: string): Promise<ProjectEntity[]>;
	findBySlug(slug: string): Promise<ProjectEntity | null>;
	update(id: string, input: Partial<Pick<ProjectEntity, 'name' | 'description' | 'slug'>>): Promise<ProjectEntity>;
	deleteById(id: string): Promise<void>;
}
