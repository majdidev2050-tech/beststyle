import { clients, clientUserAccess } from '$lib/server/db/schema';
import { eq, and, or, sql, inArray } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

const isAdmin = (locals: App.Locals) => locals.user?.role === 'SUPER_ADMIN' || locals.user?.role === 'ADMIN';

export const load = async ({ locals, url }) => {
	const userName = locals.user?.userName || '';
	const admin = isAdmin(locals);
	const searchText = url.searchParams.get('search_text') || '';

	const conditions = [];
	if (searchText) {
		conditions.push(sql`clients.id IN (SELECT rowid FROM clients_fts WHERE clients_fts MATCH ${searchText + '*'})`);
	}
	if (!admin) {
		// Non-admin : ne voir que les clients créés par soi ou auxquels on a accès
		const accessRows = await locals.db
			.select({ clientId: clientUserAccess.clientId })
			.from(clientUserAccess)
			.where(eq(clientUserAccess.userName, userName))
			.all();
		const accessibleIds = accessRows.map(r => r.clientId);

		if (accessibleIds.length > 0) {
			conditions.push(
				or(
					eq(clients.createdBy, userName),
					inArray(clients.id, accessibleIds)
				)
			);
		} else {
			conditions.push(eq(clients.createdBy, userName));
		}
	}

	const allClients = await (conditions.length > 0
		? locals.db.select().from(clients).where(and(...conditions)).limit(100).all()
		: locals.db.select().from(clients).limit(100).all());

	// Récupérer les accès utilisateurs pour chaque client afin de reconstituer le champ pour l'UI
	const allAccess = await locals.db.select().from(clientUserAccess).all();
	const accessMap = new Map<number, string[]>();
	for (const row of allAccess) {
		if (!accessMap.has(row.clientId)) {
			accessMap.set(row.clientId, []);
		}
		accessMap.get(row.clientId)!.push(row.userName);
	}

	const clientsWithAccess = allClients.map(c => ({
		...c,
		usersAccess: accessMap.get(c.id)?.join(', ') || ''
	}));

	return {
		clients: clientsWithAccess,
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

		const inserted = await locals.db.insert(clients).values({
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
			createdBy: locals.user?.userName || ''
		}).returning({ id: clients.id });

		// Sauvegarder les accès utilisateurs dans la table de liaison
		const newClientId = inserted[0]?.id;
		if (newClientId && usersAccess) {
			const userNames = usersAccess.split(/[\s,;]+/).map(u => u.trim()).filter(Boolean);
			for (const uName of userNames) {
				await locals.db.insert(clientUserAccess).values({
					clientId: newClientId,
					userName: uName
				});
			}
		}

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

		// Mettre à jour les accès utilisateurs : supprimer puis recréer
		await locals.db.delete(clientUserAccess).where(eq(clientUserAccess.clientId, id));
		if (usersAccess) {
			const userNames = usersAccess.split(/[\s,;]+/).map(u => u.trim()).filter(Boolean);
			for (const uName of userNames) {
				await locals.db.insert(clientUserAccess).values({
					clientId: id,
					userName: uName
				});
			}
		}

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

		// Les accès seront supprimés en cascade grâce à ON DELETE CASCADE
		await locals.db.delete(clients).where(eq(clients.id, id));
		return { success: true };
	}
};
