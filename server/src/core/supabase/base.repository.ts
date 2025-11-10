import { Inject } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import type { SupabaseClient } from '@supabase/supabase-js';

export abstract class BaseRepository<TEntity> {
	protected readonly client: SupabaseClient;
	protected abstract readonly table: string;

	constructor(@Inject(SupabaseService) supabase: SupabaseService) {
		this.client = supabase.getClient();
	}

	protected from() {
		return this.client.from(this.table);
	}
}


