import { apiClient } from './axios-instance';
import { API_CONFIG } from '../config/api';

export interface Project {
	id: string;
	name: string;
	description?: string;
	user_id: string;
	slug?: string;
	created_at: string;
	updated_at: string;
}

export interface CreateProjectRequest {
	name: string;
	description?: string;
	slug?: string;
}

export interface UpdateProjectRequest {
	name?: string;
	description?: string;
	slug?: string;
}

export const projectsApi = {
	getAll: async (): Promise<Project[]> => {
		try {
			const response = await apiClient.get<Project[]>('/projects');
			return response.data;
		} catch (error) {
			if (error instanceof Error) {
				throw error;
			}
			throw new Error('Failed to fetch projects');
		}
	},

	getById: async (id: string): Promise<Project> => {
		try {
			const response = await apiClient.get<Project>(`/projects/${id}`);
			return response.data;
		} catch (error) {
			if (error instanceof Error) {
				throw error;
			}
			throw new Error('Failed to fetch project');
		}
	},

	create: async (project: CreateProjectRequest): Promise<Project> => {
		try {
			const response = await apiClient.post<Project>('/projects', project);
			return response.data;
		} catch (error) {
			if (error instanceof Error) {
				throw error;
			}
			throw new Error('Failed to create project');
		}
	},

	update: async (id: string, project: UpdateProjectRequest): Promise<Project> => {
		try {
			const response = await apiClient.put<Project>(`/projects/${id}`, project);
			return response.data;
		} catch (error) {
			if (error instanceof Error) {
				throw error;
			}
			throw new Error('Failed to update project');
		}
	},

	delete: async (id: string): Promise<void> => {
		try {
			await apiClient.delete(`/projects/${id}`);
		} catch (error) {
			if (error instanceof Error) {
				throw error;
			}
			throw new Error('Failed to delete project');
		}
	},
};
