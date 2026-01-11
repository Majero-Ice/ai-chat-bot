export interface ProjectEntity {
	id: string; // UUID
	name: string;
	description?: string;
	user_id: string; // Связь с пользователем
	slug?: string; // Опциональный slug для читаемых URL
	created_at: string;
	updated_at: string;
}
