import { payments, projects, clients, clientUserAccess } from '$lib/server/db/schema';
import { eq, and, gte, lte, inArray, sql } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

const isAdmin = (locals: App.Locals) => locals.user?.role === 'SUPER_ADMIN' || locals.user?.role === 'ADMIN';

const hasPaymentAccess = (locals: App.Locals) => {
	if (isAdmin(locals)) return true;
	const role = locals.user?.role?.toUpperCase();
	return role === 'PROJET+PAIEMENT' || role === 'PROJECT_PAYMENT' || role === 'PROJECT+PAYMENT';
};

export const load = async ({ locals, url }) => {
	const userName = locals.user?.userName || '';
	const admin = isAdmin(locals);
	const searchText = url.searchParams.get('search_text') || '';
	const dateDebut = url.searchParams.get('date_debut') || '';
	const dateFin = url.searchParams.get('date_fin') || '';

	// Non-admin can only see projects they created
	const allProjects = admin
		? await locals.db.select().from(projects).all()
		: await locals.db.select().from(projects).where(eq(projects.createdBy, userName)).all();

	// Non-admin can only see clients they have access to via join table
	let allClients;
	if (admin) {
		allClients = await locals.db.select().from(clients).all();
	} else {
		const accessRows = await locals.db
			.select({ clientId: clientUserAccess.clientId })
			.from(clientUserAccess)
			.where(eq(clientUserAccess.userName, userName))
			.all();
		const accessibleIds = accessRows.map(r => r.clientId);
		allClients = accessibleIds.length > 0
			? await locals.db.select().from(clients).where(inArray(clients.id, accessibleIds)).all()
			: [];
	}

	const conditions = [];
	if (searchText) {
		conditions.push(sql`payments.id IN (SELECT rowid FROM payments_fts WHERE payments_fts MATCH ${searchText + '*'})`);
	}
	if (dateDebut) {
		conditions.push(gte(payments.paymentDate, dateDebut));
	}
	if (dateFin) {
		conditions.push(lte(payments.paymentDate, dateFin));
	}

	const baseQuery = locals.db
		.select({
			id: payments.id,
			uuid: payments.uuid,
			projectId: payments.projectId,
			clientId: payments.clientId,
			companyName: payments.companyName,
			contactName: payments.contactName,
			contactEmail: payments.contactEmail,
			projectName: payments.projectName,
			amountCents: payments.amountCents,
			paymentType: payments.paymentType,
			statusPayment: payments.statusPayment,
			invoiceNumber: payments.invoiceNumber,
			paymentDate: payments.paymentDate,
			dueDate: payments.dueDate,
			notes: payments.notes,
			createdBy: payments.createdBy,
			createdAt: payments.createdAt,
			updatedAt: payments.updatedAt
		})
		.from(payments);

	// Non-admin must have the 'projet+paiement' role to see payments, and only for their own projects
	let rawPayments: any[] = [];
	if (admin) {
		rawPayments = await (conditions.length > 0
			? baseQuery.where(and(...conditions)).limit(100).all()
			: baseQuery.limit(100).all());
	} else if (hasPaymentAccess(locals)) {
		const myProjectIds = allProjects.map(p => p.id);
		if (myProjectIds.length > 0) {
			const finalConditions = [...conditions, inArray(payments.projectId, myProjectIds)];
			rawPayments = await baseQuery.where(and(...finalConditions)).limit(100).all();
		} else {
			rawPayments = [];
		}
	}

	// Convertir cents → décimaux pour l'UI
	const allPayments = rawPayments.map(p => ({
		...p,
		amount: (p.amountCents || 0) / 1000
	}));

	return {
		payments: allPayments,
		projects: allProjects,
		clients: allClients,
		readonly: !hasPaymentAccess(locals),
		searchText,
		dateDebut,
		dateFin
	};
};

export const actions = {
	create: async ({ request, locals }) => {
		if (!hasPaymentAccess(locals)) {
			return fail(403, { forbidden: true });
		}
		const data = await request.formData();
		const projectId = parseInt(data.get('projectId')?.toString() || '0');
		const clientId = parseInt(data.get('clientId')?.toString() || '0');
		const amount = parseFloat(data.get('amount')?.toString() || '0');
		const paymentType = data.get('paymentType')?.toString() || 'ESPECE';
		const statusPayment = data.get('statusPayment')?.toString() || 'PENDING';
		const invoiceNumber = data.get('invoiceNumber')?.toString();
		const paymentDate = data.get('paymentDate')?.toString();
		const dueDate = data.get('dueDate')?.toString();
		const notes = data.get('notes')?.toString();

		if (!projectId || !clientId || isNaN(amount)) {
			return fail(400, { missing: true });
		}

		// Récupérer les infos du projet et du client pour les dénormaliser
		const project = await locals.db.select().from(projects).where(eq(projects.id, projectId)).get();
		const client = await locals.db.select().from(clients).where(eq(clients.id, clientId)).get();

		if (!project || !client) {
			return fail(400, { error: 'Projet ou client introuvable' });
		}

		// Sécurité : Non-admin ne peut créer un paiement que pour un projet qu'il a créé
		if (!isAdmin(locals) && project.createdBy !== locals.user?.userName) {
			return fail(403, { forbidden: true });
		}

		const amountCents = Math.round(amount * 1000);

		// uuid et created_by générés automatiquement côté serveur
		await locals.db.insert(payments).values({
			uuid: crypto.randomUUID(),
			projectId,
			clientId,
			companyName: client.companyName,
			contactName: client.contactName || null,
			contactEmail: client.contactEmail || null,
			projectName: project.projectName,
			amountCents,
			paymentType,
			statusPayment,
			invoiceNumber: invoiceNumber || null,
			paymentDate: paymentDate || null,
			dueDate: dueDate || null,
			notes: notes || null,
			createdBy: locals.user?.userName || 'system'
		});

		// Mettre à jour le montant dépensé du projet si le statut est PAID
		if (statusPayment === 'PAID') {
			const currentSpentCents = project.spentAmountCents || 0;
			await locals.db
				.update(projects)
				.set({ spentAmountCents: currentSpentCents + amountCents })
				.where(eq(projects.id, projectId));
		}

		return { success: true };
	},
	update: async ({ request, locals }) => {
		if (!hasPaymentAccess(locals)) {
			return fail(403, { forbidden: true });
		}
		const data = await request.formData();
		const id = parseInt(data.get('id')?.toString() || '0');
		const projectId = parseInt(data.get('projectId')?.toString() || '0');
		const clientId = parseInt(data.get('clientId')?.toString() || '0');
		const amount = parseFloat(data.get('amount')?.toString() || '0');
		const paymentType = data.get('paymentType')?.toString() || 'ESPECE';
		const statusPayment = data.get('statusPayment')?.toString() || 'PENDING';
		const invoiceNumber = data.get('invoiceNumber')?.toString();
		const paymentDate = data.get('paymentDate')?.toString();
		const dueDate = data.get('dueDate')?.toString();
		const notes = data.get('notes')?.toString();

		if (!id || !projectId || !clientId || isNaN(amount)) {
			return fail(400, { missing: true });
		}

		// Trouver l'ancien paiement pour valider l'accès
		const oldPayment = await locals.db.select().from(payments).where(eq(payments.id, id)).get();
		if (!oldPayment) {
			return fail(404, { error: 'Paiement introuvable' });
		}

		// Sécurité : Non-admin ne peut modifier que les paiements qu'il a créés
		if (!isAdmin(locals) && oldPayment.createdBy !== locals.user?.userName) {
			return fail(403, { forbidden: true });
		}

		// Récupérer les infos du projet et du client
		const project = await locals.db.select().from(projects).where(eq(projects.id, projectId)).get();
		const client = await locals.db.select().from(clients).where(eq(clients.id, clientId)).get();

		if (!project || !client) {
			return fail(400, { error: 'Projet ou client introuvable' });
		}

		// Sécurité additionnelle : le projet cible doit aussi appartenir au user s'il n'est pas admin
		if (!isAdmin(locals) && project.createdBy !== locals.user?.userName) {
			return fail(403, { forbidden: true });
		}

		const amountCents = Math.round(amount * 1000);

		await locals.db
			.update(payments)
			.set({
				projectId,
				clientId,
				companyName: client.companyName,
				contactName: client.contactName || null,
				contactEmail: client.contactEmail || null,
				projectName: project.projectName,
				amountCents,
				paymentType,
				statusPayment,
				invoiceNumber: invoiceNumber || null,
				paymentDate: paymentDate || null,
				dueDate: dueDate || null,
				notes: notes || null,
				updatedAt: new Date().toISOString()
			})
			.where(eq(payments.id, id));

		// Ajuster le spentAmountCents du projet si le statut payé a changé
		let currentSpentCents = project.spentAmountCents || 0;
		// Déduire l'ancien montant s'il était PAID
		if (oldPayment.statusPayment === 'PAID') {
			currentSpentCents -= oldPayment.amountCents;
		}
		// Ajouter le nouveau montant s'il est PAID
		if (statusPayment === 'PAID') {
			currentSpentCents += amountCents;
		}
		await locals.db
			.update(projects)
			.set({ spentAmountCents: Math.max(0, currentSpentCents) })
			.where(eq(projects.id, projectId));

		return { success: true };
	},
	delete: async ({ request, locals }) => {
		if (!hasPaymentAccess(locals)) {
			return fail(403, { forbidden: true });
		}
		const data = await request.formData();
		const id = parseInt(data.get('id')?.toString() || '0');

		if (!id) {
			return fail(400, { missing: true });
		}

		const oldPayment = await locals.db.select().from(payments).where(eq(payments.id, id)).get();
		if (!oldPayment) {
			return fail(404, { error: 'Paiement introuvable' });
		}

		// Sécurité : Non-admin ne peut supprimer que les paiements qu'il a créés
		if (!isAdmin(locals) && oldPayment.createdBy !== locals.user?.userName) {
			return fail(403, { forbidden: true });
		}

		await locals.db.delete(payments).where(eq(payments.id, id));

		// Si le paiement supprimé était PAID, déduire du spentAmountCents du projet
		if (oldPayment.statusPayment === 'PAID') {
			const project = await locals.db
				.select()
				.from(projects)
				.where(eq(projects.id, oldPayment.projectId))
				.get();
			if (project) {
				const currentSpentCents = project.spentAmountCents || 0;
				await locals.db
					.update(projects)
					.set({ spentAmountCents: Math.max(0, currentSpentCents - oldPayment.amountCents) })
					.where(eq(projects.id, oldPayment.projectId));
			}
		}

		return { success: true };
	}
};
