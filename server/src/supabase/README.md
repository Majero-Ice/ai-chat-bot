Setup:

- Set environment variables:
  - SUPABASE_URL
  - SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY)

Usage:

1) Inject SupabaseService to access the client:

```ts
constructor(private readonly supabase: SupabaseService) {}
```

2) Create repositories by extending BaseRepository:

```ts
interface Todo { id: string; title: string; done: boolean; }
export class TodoRepository extends BaseRepository<Todo> {
  protected readonly table = 'todos';

  async list() {
    return this.from().select('*');
  }
}
```


