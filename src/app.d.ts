declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			db: ReturnType<typeof import('./lib/server/db/index').createDb>;
			user: import('./lib/server/db/schema').users.$inferSelect | null;
			client: import('./lib/server/db/schema').clients.$inferSelect | null;
		}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: {
				DB: import('@cloudflare/workers-types').D1Database;
			};
			context: {
				waitUntil(promise: Promise<any>): void;
			};
			caches: CacheStorage & { default: Cache }
		}
	}
}

export {};
