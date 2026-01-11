export interface AuthResponseDto {
	access_token: string;
	refresh_token?: string;
	user: {
		id: string;
		email: string;
		full_name?: string;
		avatar_url?: string;
	};
}


