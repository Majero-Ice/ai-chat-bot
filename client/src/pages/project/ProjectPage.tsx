import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChatWidget } from '../../widgets/chat-widget';
import { UploadWidget } from '../../widgets/upload-widget';
import { projectsApi, Project } from '../../shared/api/projects-api';
import './ProjectPage.css';

export const ProjectPage: React.FC = () => {
	const { projectId } = useParams<{ projectId: string }>();
	const navigate = useNavigate();
	const [project, setProject] = useState<Project | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (projectId) {
			loadProject();
		} else {
			setError('Project ID is required');
			setLoading(false);
		}
	}, [projectId]);

	const loadProject = async () => {
		if (!projectId) return;

		try {
			setLoading(true);
			setError(null);
			const data = await projectsApi.getById(projectId);
			setProject(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load project');
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="project-page">
				<div className="project-page__loading">Loading project...</div>
			</div>
		);
	}

	if (error || !project) {
		return (
			<div className="project-page">
				<div className="project-page__error">
					<p>{error || 'Project not found'}</p>
					<button onClick={() => navigate('/projects')} className="project-page__back-btn">
						Back to Projects
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="project-page">
			<header className="project-page__header">
				<div className="project-page__header-content">
					<button onClick={() => navigate('/projects')} className="project-page__back-btn">
						← Back to Projects
					</button>
					<div>
						<h1 className="project-page__title">{project.name}</h1>
						{project.description && (
							<p className="project-page__subtitle">{project.description}</p>
						)}
					</div>
				</div>
			</header>
			<main className="project-page__main">
				<div className="project-page__sidebar">
					<UploadWidget />
				</div>
				<div className="project-page__content">
					<ChatWidget />
				</div>
			</main>
		</div>
	);
};
