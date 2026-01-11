import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi, Project } from '../../shared/api/projects-api';
import { useAuth } from '../../shared/contexts/AuthContext';
import { Button, Input } from '../../shared/ui';
import './ProjectsListPage.css';

export const ProjectsListPage: React.FC = () => {
	const navigate = useNavigate();
	const { user, logout } = useAuth();
	const [projects, setProjects] = useState<Project[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [newProjectName, setNewProjectName] = useState('');
	const [newProjectDescription, setNewProjectDescription] = useState('');

	const handleLogout = async () => {
		try {
			await logout();
			navigate('/auth');
		} catch (err) {
			console.error('Logout error:', err);
		}
	};

	useEffect(() => {
		loadProjects();
	}, []);

	const loadProjects = async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await projectsApi.getAll();
			setProjects(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load projects');
		} finally {
			setLoading(false);
		}
	};

	const handleCreateProject = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newProjectName.trim()) return;

		try {
			const project = await projectsApi.create({
				name: newProjectName.trim(),
				description: newProjectDescription.trim() || undefined,
			});
			setProjects([project, ...projects]);
			setNewProjectName('');
			setNewProjectDescription('');
			setShowCreateForm(false);
			// Переход на страницу проекта
			navigate(`/projects/${project.id}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to create project');
		}
	};

	const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		if (!confirm('Are you sure you want to delete this project?')) return;

		try {
			await projectsApi.delete(id);
			setProjects(projects.filter((p) => p.id !== id));
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to delete project');
		}
	};

	const handleProjectClick = (id: string) => {
		navigate(`/projects/${id}`);
	};

	if (loading) {
		return (
			<div className="projects-list-page">
				<div className="projects-list-page__loading">Loading projects...</div>
			</div>
		);
	}

	return (
		<div className="projects-list-page">
			<header className="projects-list-page__header">
				<div>
					<h1 className="projects-list-page__title">My Projects</h1>
					{user && (
						<p className="projects-list-page__user-info">
							{user.email} {user.full_name && `(${user.full_name})`}
						</p>
					)}
				</div>
				<div className="projects-list-page__header-actions">
					<Button onClick={() => setShowCreateForm(!showCreateForm)}>
						{showCreateForm ? 'Cancel' : 'Create New Project'}
					</Button>
					<Button variant="secondary" onClick={handleLogout}>
						Logout
					</Button>
				</div>
			</header>

			{error && <div className="projects-list-page__error">{error}</div>}

			{showCreateForm && (
				<div className="projects-list-page__create-form">
					<form onSubmit={handleCreateProject}>
						<Input
							type="text"
							placeholder="Project name"
							value={newProjectName}
							onChange={(e) => setNewProjectName(e.target.value)}
							required
						/>
						<textarea
							className="projects-list-page__description-input"
							placeholder="Description (optional)"
							value={newProjectDescription}
							onChange={(e) => setNewProjectDescription(e.target.value)}
							rows={3}
						/>
						<Button type="submit">Create Project</Button>
					</form>
				</div>
			)}

			<div className="projects-list-page__grid">
				{projects.length === 0 ? (
					<div className="projects-list-page__empty">
						<p>No projects yet. Create your first project to get started!</p>
					</div>
				) : (
					projects.map((project) => (
						<div
							key={project.id}
							className="projects-list-page__card"
							onClick={() => handleProjectClick(project.id)}
						>
							<div className="projects-list-page__card-header">
								<h2 className="projects-list-page__card-title">{project.name}</h2>
								<button
									className="projects-list-page__delete-btn"
									onClick={(e) => handleDeleteProject(project.id, e)}
									aria-label="Delete project"
								>
									×
								</button>
							</div>
							{project.description && (
								<p className="projects-list-page__card-description">{project.description}</p>
							)}
							<div className="projects-list-page__card-footer">
								<span className="projects-list-page__card-date">
									{new Date(project.created_at).toLocaleDateString()}
								</span>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
};
