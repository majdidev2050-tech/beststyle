import { users } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load = async ({ locals, url }) => {
	const searchText = url.searchParams.get('search_text') || '';

	const allUsers = await (searchText
		? locals.db.select().from(users).where(sql`users.id IN (SELECT rowid FROM users_fts WHERE users_fts MATCH ${searchText + '*'})`).limit(100).all()
		: locals.db.select().from(users).limit(100).all());

	return {
		users: allUsers,
		searchText
	};
};

export const actions = {
	create: async ({ request, locals }) => {
		const data = await request.formData();
		const userName = data.get('userName')?.toString();
		const firstName = data.get('firstName')?.toString();
		const lastName = data.get('lastName')?.toString();
		const email = data.get('email')?.toString();
		const password = data.get('password')?.toString();
		const role = data.get('role')?.toString() || 'EMPLOYEE';

		if (!userName || !firstName || !lastName || !email || !password) {
			return fail(400, { missing: true });
		}

		await locals.db.insert(users).values({
			userName,
			firstName,
			lastName,
			email,
			passwordHash: password,
			role
		});

		return { success: true };
	},
	update: async ({ request, locals }) => {
		const data = await request.formData();
		const userName = data.get('userName')?.toString();
		const firstName = data.get('firstName')?.toString();
		const lastName = data.get('lastName')?.toString();
		const email = data.get('email')?.toString();
		const role = data.get('role')?.toString() || 'EMPLOYEE';
		const isActive = data.get('isActive')?.toString() === '1' ? 1 : 0;

		if (!userName || !firstName || !lastName || !email) {
			return fail(400, { missing: true });
		}

		await locals.db
			.update(users)
			.set({
				firstName,
				lastName,
				email,
				role,
				isActive,
				updatedAt: new Date().toISOString()
			})
			.where(eq(users.userName, userName));

		return { success: true };
	},
	delete: async ({ request, locals }) => {
		const data = await request.formData();
		const userName = data.get('userName')?.toString();
		if (userName) {
			await locals.db.delete(users).where(eq(users.userName, userName));
		}
		return { success: true };
	}
};
