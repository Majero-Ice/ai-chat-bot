import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, AuthResponse, User } from '../api/auth-api';
import { authStorage } from '../utils/auth-storage';

interface AuthContextType {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	login: (email: string, password: string) => Promise<void>;
	register: (email: string, password: string, fullName?: string) => Promise<void>;
	logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};

interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Проверяем сохраненные данные при загрузке
		const savedUser = authStorage.getUser();
		const savedToken = authStorage.getAccessToken();

		if (savedUser && savedToken) {
			setUser(savedUser);
		}

		setIsLoading(false);
	}, []);

	const handleAuthResponse = (response: AuthResponse) => {
		authStorage.setAccessToken(response.access_token);
		if (response.refresh_token) {
			authStorage.setRefreshToken(response.refresh_token);
		}
		authStorage.setUser(response.user);
		setUser(response.user);
	};

	const login = async (email: string, password: string) => {
		const response = await authApi.login({ email, password });
		handleAuthResponse(response);
	};

	const register = async (email: string, password: string, fullName?: string) => {
		const response = await authApi.register({ email, password, full_name: fullName });
		handleAuthResponse(response);
	};

	const logout = async () => {
		const token = authStorage.getAccessToken();
		if (token) {
			try {
				await authApi.logout(token);
			} catch (error) {
				console.error('Logout error:', error);
			}
		}
		authStorage.clear();
		setUser(null);
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				isAuthenticated: !!user,
				isLoading,
				login,
				register,
				logout,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};
