import axios from 'axios';
import { API_CONFIG } from '../config/api';
import { authStorage } from '../utils/auth-storage';

export const apiClient = axios.create({
	baseURL: API_CONFIG.baseURL,
});

// Interceptor для автоматической отправки токена
apiClient.interceptors.request.use(
	(config) => {
		const token = authStorage.getAccessToken();
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Interceptor для обработки ошибок аутентификации
apiClient.interceptors.response.use(
	(response) => response,
	async (error) => {
		if (error.response?.status === 401) {
			// Токен истек или невалиден - очищаем хранилище
			authStorage.clear();
			// Можно перенаправить на страницу логина
			if (window.location.pathname !== '/auth') {
				window.location.href = '/auth';
			}
		}
		return Promise.reject(error);
	}
);
