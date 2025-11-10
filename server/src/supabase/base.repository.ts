import { SupabaseService } from './supabase.service';
import type { SupabaseClient } from '@supabase/supabase-js';

export abstract class BaseRepository<TEntity extends Record<string, unknown>> {
	protected readonly client: SupabaseClient;
	protected abstract readonly table: string;

	constructor(supabase: SupabaseService) {
		this.client = supabase.getClient();
	}

	protected from() {
		return this.client.from(this.table);
	}
}


