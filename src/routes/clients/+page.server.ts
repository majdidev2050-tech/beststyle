import { clients } from '$lib/server/db/schema';
import { eq, like, and, or } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

const isAdmin = (locals: App.Locals) => locals.user?.role === 'SUPER_ADMIN' || locals.user?.role === 'ADMIN';

const matchesUserAccess = (usersAccessVal: string | null | undefined, userName: string) => {
	if (!usersAccessVal) return false;
	const trimmed = usersAccessVal.trim();
	if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
		try {
			const parsed = JSON.parse(trimmed);
			if (Array.isArray(parsed)) {
				return parsed.map(p => p.toString().toLowerCase()).includes(userName.toLowerCase());
			}
		} catch (e) {}
	}
	const parts = trimmed.split(/[\s,;]+/).map(p => p.trim().toLowerCase());
	return parts.includes(userName.toLowerCase());
};

export const load = async ({ locals, url }) => {
	const userName = locals.user?.userName || '';
	const admin = isAdmin(locals);
	const searchText = url.searchParams.get('search_text') || '';

	const conditions = [];
	if (searchText) {
		conditions.push(like(clients.searchText, `%${searchText}%`));
	}
	if (!admin) {
		conditions.push(
			or(
				eq(clients.createdBy, userName),
				like(clients.usersAccess, `%${userName}%`)
			)
		);
	}

	const rawClients = await (conditions.length > 0
		? locals.db.select().from(clients).where(and(...conditions)).limit(100).all()
		: locals.db.select().from(clients).limit(100).all());

	const allClients = admin
		? rawClients
		: rawClients.filter(c => matchesUserAccess(c.usersAccess, userName));

	return {
		clients: allClients,
		readonly: !admin,
		searchText
	};
};

export const actions = {
	create: async ({ request, locals }) => {
		if (!isAdmin(locals)) {
			return fail(403, { forbidden: true });
		}
		const data = await request.formData();
		const companyName = data.get('companyName')?.toString();
		const contactName = data.get('contactName')?.toString();
		const contactEmail = data.get('contactEmail')?.toString();
		const userLogin = data.get('userLogin')?.toString();
		const passwordHash = data.get('passwordHash')?.toString();
		const contactPhone = data.get('contactPhone')?.toString();
		const billingAddress = data.get('billingAddress')?.toString();
		const vatNumber = data.get('vatNumber')?.toString();
		const notes = data.get('notes')?.toString();
		const usersAccess = data.get('usersAccess')?.toString();

		if (!companyName) {
			return fail(400, { missing: true });
		}

		await locals.db.insert(clients).values({
			uuid: crypto.randomUUID(),
			companyName,
			contactName: contactName || null,
			contactEmail: contactEmail || null,
			userLogin: userLogin || null,
			passwordHash: passwordHash || null,
			contactPhone: contactPhone || null,
			billingAddress: billingAddress || null,
			vatNumber: vatNumber || null,
			notes: notes || null,
			usersAccess: usersAccess || null,
			createdBy: locals.user?.userName || null
		});

		return { success: true };
	},
	update: async ({ request, locals }) => {
		if (!isAdmin(locals)) {
			return fail(403, { forbidden: true });
		}
		const data = await request.formData();
		const id = parseInt(data.get('id')?.toString() || '0');
		const companyName = data.get('companyName')?.toString();
		const contactName = data.get('contactName')?.toString();
		const contactEmail = data.get('contactEmail')?.toString();
		const userLogin = data.get('userLogin')?.toString();
		const passwordHash = data.get('passwordHash')?.toString();
		const contactPhone = data.get('contactPhone')?.toString();
		const billingAddress = data.get('billingAddress')?.toString();
		const vatNumber = data.get('vatNumber')?.toString();
		const notes = data.get('notes')?.toString();
		const usersAccess = data.get('usersAccess')?.toString();

		if (!id || !companyName) {
			return fail(400, { missing: true });
		}

		const updateData: Record<string, any> = {
			companyName,
			contactName: contactName || null,
			contactEmail: contactEmail || null,
			contactPhone: contactPhone || null,
			billingAddress: billingAddress || null,
			vatNumber: vatNumber || null,
			notes: notes || null,
			usersAccess: usersAccess || null,
			updatedAt: new Date().toISOString()
		};

		// userLogin : on met à jour si fourni (peut être vidé pour retirer l'accès)
		updateData.userLogin = userLogin || null;

		// passwordHash : seulement si un nouveau mot de passe est fourni
		if (passwordHash && passwordHash.trim() !== '') {
			updateData.passwordHash = passwordHash;
		}

		await locals.db
			.update(clients)
			.set(updateData)
			.where(eq(clients.id, id));

		return { success: true };
	},
	delete: async ({ request, locals }) => {
		if (!isAdmin(locals)) {
			return fail(403, { forbidden: true });
		}
		const data = await request.formData();
		const id = parseInt(data.get('id')?.toString() || '0');

		if (!id) {
			return fail(400, { missing: true });
		}

		await locals.db.delete(clients).where(eq(clients.id, id));
		return { success: true };
	}
};
