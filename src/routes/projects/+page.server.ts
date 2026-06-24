import { projects, clients, photosProjects } from '$lib/server/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';

const isAdmin = (locals: App.Locals) => locals.user?.role === 'SUPER_ADMIN' || locals.user?.role === 'ADMIN';
const isClientRole = (locals: App.Locals) => locals.user?.role === 'CLIENT';

export const load = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const userName = locals.user.userName;
	const admin = isAdmin(locals);
	const isClient = isClientRole(locals);

	// Les clients sont redirigés vers leur propre interface
	if (isClient) {
		throw redirect(303, '/projects/list_project_cl');
	}

	const searchText = url.searchParams.get('search_text') || '';
	const dateDebut = url.searchParams.get('date_debut') || '';
	const dateFin = url.searchParams.get('date_fin') || '';

	// Pour l'équipe (non-admin), on filtre les clients qu'ils ont créés pour le menu déroulant
	const allClients = admin
		? await locals.db.select().from(clients).all()
		: await locals.db.select().from(clients).where(eq(clients.createdBy, userName)).all();

	const conditions = [];
	if (searchText) {
		conditions.push(sql`projects.id IN (SELECT rowid FROM projects_fts WHERE projects_fts MATCH ${searchText + '*'})`);
	}
	if (dateDebut) {
		conditions.push(gte(projects.startDate, dateDebut));
	}
	if (dateFin) {
		conditions.push(lte(projects.startDate, dateFin));
	}
	if (!admin) {
		conditions.push(eq(projects.createdBy, userName));
	}

	const baseQuery = locals.db
		.select({
			id: projects.id,
			uuid: projects.uuid,
			projectName: projects.projectName,
			companyName: projects.companyName,
			contactName: projects.contactName,
			contactEmail: projects.contactEmail,
			description: projects.description,
			statusProject: projects.statusProject,
			priority: projects.priority,
			budgetAmountCents: projects.budgetAmountCents,
			spentAmountCents: projects.spentAmountCents,
			progressPercentage: projects.progressPercentage,
			startDate: projects.startDate,
			dueDate: projects.dueDate,
			completedAt: projects.completedAt,
			reference: projects.reference,
			userName: projects.userName,
			clientId: projects.clientId,
			createdBy: projects.createdBy,
			createdAt: projects.createdAt,
			updatedAt: projects.updatedAt,
			clientCompanyName: clients.companyName
		})
		.from(projects)
		.leftJoin(clients, eq(projects.clientId, clients.id));

	const rawProjects = await (conditions.length > 0
		? baseQuery.where(and(...conditions)).limit(100).all()
		: baseQuery.limit(100).all());

	// Convertir cents → décimaux pour l'UI
	const allProjects = rawProjects.map(p => ({
		...p,
		budgetAmount: (p.budgetAmountCents || 0) / 1000,
		spentAmount: (p.spentAmountCents || 0) / 1000
	}));

	return {
		projects: allProjects,
		clients: allClients,
		readonly: false,
		searchText,
		dateDebut,
		dateFin
	};
};

export const actions = {
	create: async ({ request, locals, platform }) => {
		if (isClientRole(locals)) {
			return fail(403, { forbidden: true });
		}
		const data = await request.formData();
		const projectName = data.get('projectName')?.toString();
		const clientId = parseInt(data.get('clientId')?.toString() || '0');
		const description = data.get('description')?.toString();
		const statusProject = data.get('statusProject')?.toString() || 'NEW_PROJECT';
		const priority = data.get('priority')?.toString() || 'MEDIUM';
		const budgetAmount = parseFloat(data.get('budgetAmount')?.toString() || '0');
		const startDate = data.get('startDate')?.toString();
		const dueDate = data.get('dueDate')?.toString();
		const reference = data.get('reference')?.toString();

		if (!projectName || !clientId) {
			return fail(400, { missing: true });
		}

		// Récupérer les infos du client pour les dénormaliser
		const client = await locals.db.select().from(clients).where(eq(clients.id, clientId)).get();
		if (!client) {
			return fail(400, { error: 'Client introuvable' });
		}

		// uuid et created_by générés automatiquement côté serveur
		const inserted = await locals.db.insert(projects).values({
			uuid: crypto.randomUUID(),
			clientId,
			companyName: client.companyName,
			contactName: client.contactName || null,
			contactEmail: client.contactEmail || null,
			projectName,
			description: description || null,
			statusProject,
			priority,
			budgetAmountCents: Math.round(budgetAmount * 1000),
			spentAmountCents: 0,
			progressPercentage: 0,
			startDate: startDate || null,
			dueDate: dueDate || null,
			reference: reference || null,
			createdBy: locals.user?.userName || 'system',
			userName: locals.user?.userName || 'system'
		}).returning({ id: projects.id });

		const newProjectId = inserted[0]?.id;

		if (newProjectId) {
			const files = data.getAll('images') as File[];
			const bucket = platform?.env?.BUCKET;

			for (const file of files) {
				if (file && file.size > 0 && file.name) {
					const uniqueId = crypto.randomUUID();
					const ext = file.name.split('.').pop();
					const filename = `${uniqueId}.${ext}`;

					if (bucket) {
						const arrayBuffer = await file.arrayBuffer();
						await bucket.put(filename, arrayBuffer, {
							httpMetadata: {
								contentType: file.type
							}
						});
					} else {
						console.warn('R2 Bucket not configured, skipping image upload');
					}

					await locals.db.insert(photosProjects).values({
						id: crypto.randomUUID(),
						projectId: newProjectId,
						filename: file.name,
						description: description || null,
						r2Key: filename,
						url: `/uploads/${filename}`
					});
				}
			}
		}

		return { success: true };
	},
	update: async ({ request, locals }) => {
		if (isClientRole(locals)) {
			return fail(403, { forbidden: true });
		}
		const data = await request.formData();
		const id = parseInt(data.get('id')?.toString() || '0');
		const projectName = data.get('projectName')?.toString();
		const clientId = parseInt(data.get('clientId')?.toString() || '0');
		const description = data.get('description')?.toString();
		const statusProject = data.get('statusProject')?.toString();
		const priority = data.get('priority')?.toString();
		const budgetAmount = parseFloat(data.get('budgetAmount')?.toString() || '0');
		const spentAmount = parseFloat(data.get('spentAmount')?.toString() || '0');
		const progressPercentage = parseInt(data.get('progressPercentage')?.toString() || '0');
		const startDate = data.get('startDate')?.toString();
		const dueDate = data.get('dueDate')?.toString();
		const reference = data.get('reference')?.toString();

		if (!id || !projectName || !clientId) {
			return fail(400, { missing: true });
		}

		// Sécurité : Si non-admin, on ne peut modifier que ses propres projets
		if (!isAdmin(locals)) {
			const existing = await locals.db.select().from(projects).where(eq(projects.id, id)).get();
			if (!existing || existing.createdBy !== locals.user?.userName) {
				return fail(403, { forbidden: true });
			}
		}

		// Récupérer les infos du client pour mettre à jour les champs dénormalisés
		const client = await locals.db.select().from(clients).where(eq(clients.id, clientId)).get();
		if (!client) {
			return fail(400, { error: 'Client introuvable' });
		}

		await locals.db
			.update(projects)
			.set({
				clientId,
				companyName: client.companyName,
				contactName: client.contactName || null,
				contactEmail: client.contactEmail || null,
				projectName,
				description: description || null,
				statusProject: statusProject || 'NEW_PROJECT',
				priority: priority || 'MEDIUM',
				budgetAmountCents: Math.round(budgetAmount * 1000),
				spentAmountCents: Math.round(spentAmount * 1000),
				progressPercentage,
				startDate: startDate || null,
				dueDate: dueDate || null,
				reference: reference || null,
				updatedAt: new Date().toISOString()
			})
			.where(eq(projects.id, id));

		return { success: true };
	},
	delete: async ({ request, locals }) => {
		if (isClientRole(locals)) {
			return fail(403, { forbidden: true });
		}
		const data = await request.formData();
		const id = parseInt(data.get('id')?.toString() || '0');

		if (!id) {
			return fail(400, { missing: true });
		}

		// Sécurité : Si non-admin, on ne peut supprimer que ses propres projets
		if (!isAdmin(locals)) {
			const existing = await locals.db.select().from(projects).where(eq(projects.id, id)).get();
			if (!existing || existing.createdBy !== locals.user?.userName) {
				return fail(403, { forbidden: true });
			}
		}

		await locals.db.delete(projects).where(eq(projects.id, id));
		return { success: true };
	}
};
