import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProjectDto {
	@IsString()
	@IsOptional()
	@MaxLength(255)
	name?: string;

	@IsString()
	@IsOptional()
	@MaxLength(1000)
	description?: string;

	@IsString()
	@IsOptional()
	@MaxLength(100)
	slug?: string;
}
