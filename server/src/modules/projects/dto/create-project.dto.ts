import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProjectDto {
	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	name: string;

	@IsString()
	@IsOptional()
	@MaxLength(1000)
	description?: string;

	@IsString()
	@IsOptional()
	@MaxLength(100)
	slug?: string;
}
