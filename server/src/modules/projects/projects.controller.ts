import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Body,
	Param,
	HttpCode,
	HttpStatus,
	UseGuards,
	Request,
	HttpException,
	Logger,
} from '@nestjs/common';
import { ProjectsService } from '../db/projects/projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('projects')
@UseGuards(AuthGuard)
export class ProjectsController {
	private readonly logger = new Logger(ProjectsController.name);

	constructor(private readonly projectsService: ProjectsService) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	async create(@Body() createProjectDto: CreateProjectDto, @Request() req: any) {
		try {
			const userId = req.user.id; // Получаем из токена через AuthGuard
			return await this.projectsService.create({
				...createProjectDto,
				user_id: userId,
			});
		} catch (error: any) {
			this.logger.error('Error creating project:', error);
			const errorMessage = error.message || error.details || 'Failed to create project';
			const errorCode = error.code;
			
			if (errorCode === '42P01' || errorMessage.includes('does not exist')) {
				// Table does not exist
				throw new HttpException(
					{
						statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
						message: 'Projects table does not exist in database. Please create it first.',
						error: 'Database Error',
						details: 'Run the SQL script in server/src/modules/db/projects/create-projects-table.sql',
					},
					HttpStatus.INTERNAL_SERVER_ERROR,
				);
			}
			
			throw new HttpException(
				{
					statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
					message: errorMessage,
					error: errorCode || 'Internal Server Error',
				},
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	@Get()
	async findAll(@Request() req: any) {
		try {
			const userId = req.user.id; // Получаем из токена через AuthGuard
			return await this.projectsService.findByUserId(userId);
		} catch (error: any) {
			this.logger.error('Error fetching projects:', error);
			const errorMessage = error.message || error.details || 'Failed to fetch projects';
			const errorCode = error.code;
			
			if (errorCode === '42P01' || errorMessage.includes('does not exist')) {
				// Table does not exist
				throw new HttpException(
					{
						statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
						message: 'Projects table does not exist in database. Please create it first.',
						error: 'Database Error',
						details: 'Run the SQL script in server/src/modules/db/projects/create-projects-table.sql',
					},
					HttpStatus.INTERNAL_SERVER_ERROR,
				);
			}
			
			throw new HttpException(
				{
					statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
					message: errorMessage,
					error: errorCode || 'Internal Server Error',
				},
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		try {
			return await this.projectsService.findById(id);
		} catch (error: any) {
			this.logger.error('Error fetching project:', error);
			throw new HttpException(
				error.message || 'Failed to fetch project',
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	@Put(':id')
	async update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
		try {
			return await this.projectsService.update(id, updateProjectDto);
		} catch (error: any) {
			this.logger.error('Error updating project:', error);
			throw new HttpException(
				error.message || 'Failed to update project',
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	async remove(@Param('id') id: string) {
		try {
			return await this.projectsService.deleteById(id);
		} catch (error: any) {
			this.logger.error('Error deleting project:', error);
			throw new HttpException(
				error.message || 'Failed to delete project',
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}
}
