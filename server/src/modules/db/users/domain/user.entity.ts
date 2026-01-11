export interface UserEntity {
	id: string; // UUID из Supabase Auth
	email: string;
	full_name?: string;
	avatar_url?: string;
	created_at: string;
	updated_at: string;
}

