const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';

export const authStorage = {
	getAccessToken: (): string | null => {
		return localStorage.getItem(ACCESS_TOKEN_KEY);
	},

	setAccessToken: (token: string): void => {
		localStorage.setItem(ACCESS_TOKEN_KEY, token);
	},

	getRefreshToken: (): string | null => {
		return localStorage.getItem(REFRESH_TOKEN_KEY);
	},

	setRefreshToken: (token: string): void => {
		localStorage.setItem(REFRESH_TOKEN_KEY, token);
	},

	getUser: (): any | null => {
		const userStr = localStorage.getItem(USER_KEY);
		return userStr ? JSON.parse(userStr) : null;
	},

	setUser: (user: any): void => {
		localStorage.setItem(USER_KEY, JSON.stringify(user));
	},

	clear: (): void => {
		localStorage.removeItem(ACCESS_TOKEN_KEY);
		localStorage.removeItem(REFRESH_TOKEN_KEY);
		localStorage.removeItem(USER_KEY);
	},
};
