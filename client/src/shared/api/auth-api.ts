import axios from 'axios';
import { API_CONFIG } from '../config/api';

export interface User {
	id: string;
	email: string;
	full_name?: string;
	avatar_url?: string;
}

export interface AuthResponse {
	access_token: string;
	refresh_token?: string;
	user: User;
}

export interface RegisterRequest {
	email: string;
	password: string;
	full_name?: string;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export const authApi = {
	register: async (data: RegisterRequest): Promise<AuthResponse> => {
		try {
			const response = await axios.post<AuthResponse>(`${API_CONFIG.baseURL}/auth/register`, data);
			return response.data;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const message = error.response?.data?.message || error.message || 'Failed to register';
				throw new Error(message);
			}
			throw error;
		}
	},

	login: async (data: LoginRequest): Promise<AuthResponse> => {
		try {
			const response = await axios.post<AuthResponse>(`${API_CONFIG.baseURL}/auth/login`, data);
			return response.data;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const message = error.response?.data?.message || error.message || 'Failed to login';
				throw new Error(message);
			}
			throw error;
		}
	},

	refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
		try {
			const response = await axios.post<AuthResponse>(`${API_CONFIG.baseURL}/auth/refresh`, {
				refresh_token: refreshToken,
			});
			return response.data;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const message = error.response?.data?.message || error.message || 'Failed to refresh token';
				throw new Error(message);
			}
			throw error;
		}
	},

	logout: async (token: string): Promise<void> => {
		try {
			await axios.post(`${API_CONFIG.baseURL}/auth/logout`, { token });
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const message = error.response?.data?.message || error.message || 'Failed to logout';
				throw new Error(message);
			}
			throw error;
		}
	},
};
