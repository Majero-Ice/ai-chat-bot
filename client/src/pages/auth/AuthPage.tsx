import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/contexts/AuthContext';
import { Button, Input } from '../../shared/ui';
import './AuthPage.css';

export const AuthPage: React.FC = () => {
	const navigate = useNavigate();
	const { login, register, isAuthenticated, isLoading } = useAuth();

	useEffect(() => {
		if (!isLoading && isAuthenticated) {
			navigate('/projects', { replace: true });
		}
	}, [isAuthenticated, isLoading, navigate]);
	const [isLogin, setIsLogin] = useState(true);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [fullName, setFullName] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			if (isLogin) {
				await login(email, password);
			} else {
				await register(email, password, fullName || undefined);
			}
			navigate('/projects');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="auth-page">
			<div className="auth-page__container">
				<div className="auth-page__header">
					<h1 className="auth-page__title">AI Chat Bot</h1>
					<p className="auth-page__subtitle">
						{isLogin ? 'Войдите в свой аккаунт' : 'Создайте новый аккаунт'}
					</p>
				</div>

				<div className="auth-page__tabs">
					<button
						className={`auth-page__tab ${isLogin ? 'auth-page__tab--active' : ''}`}
						onClick={() => {
							setIsLogin(true);
							setError(null);
						}}
					>
						Вход
					</button>
					<button
						className={`auth-page__tab ${!isLogin ? 'auth-page__tab--active' : ''}`}
						onClick={() => {
							setIsLogin(false);
							setError(null);
						}}
					>
						Регистрация
					</button>
				</div>

				<form className="auth-page__form" onSubmit={handleSubmit}>
					{error && <div className="auth-page__error">{error}</div>}

					{!isLogin && (
						<Input
							type="text"
							placeholder="Имя (необязательно)"
							value={fullName}
							onChange={(e) => setFullName(e.target.value)}
						/>
					)}

					<Input
						type="email"
						placeholder="Email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
					/>

					<Input
						type="password"
						placeholder="Пароль"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						minLength={6}
					/>

					<Button type="submit" isLoading={loading} disabled={loading}>
						{isLogin ? 'Войти' : 'Зарегистрироваться'}
					</Button>
				</form>
			</div>
		</div>
	);
};
