import { projects, clients, clientUserAccess } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

const isAdmin = (locals: App.Locals) => locals.user?.role === 'SUPER_ADMIN' || locals.user?.role === 'ADMIN';

export const load = async ({ locals }) => {
	const userName = locals.user?.userName || '';
	const admin = isAdmin(locals);

	// Static workflow columns mapping to project status
	const workflows = [
		{ id: 'NEW_PROJECT', position: 1, workflowName: 'Nouveaux projets' },
		{ id: 'IN_PROGRESS', position: 2, workflowName: 'En cours' },
		{ id: 'PENDING_VALIDATION', position: 3, workflowName: 'À valider' },
		{ id: 'READY_TO_PRINT', position: 4, workflowName: 'Prêt à imprimer' },
		{ id: 'PRINTED', position: 5, workflowName: 'Imprimé' },
		{ id: 'DELIVERED', position: 6, workflowName: 'Livré' },
		{ id: 'PENDING_PAYMENT', position: 7, workflowName: 'En attente de paiement' },
		{ id: 'CANCELLED', position: 8, workflowName: 'Annulé' }
	];

	// Retrieve all projects with client company name
	const projectsQuery = locals.db
		.select({
			id: projects.id,
			uuid: projects.uuid,
			projectName: projects.projectName,
			companyName: projects.companyName,
			description: projects.description,
			statusProject: projects.statusProject,
			priority: projects.priority,
			budgetAmountCents: projects.budgetAmountCents,
			spentAmountCents: projects.spentAmountCents,
			progressPercentage: projects.progressPercentage,
			startDate: projects.startDate,
			dueDate: projects.dueDate,
			clientId: projects.clientId,
			createdBy: projects.createdBy,
			clientCompanyName: clients.companyName
		})
		.from(projects)
		.leftJoin(clients, eq(projects.clientId, clients.id));

	// Non-admins only see projects created by themselves
	const rawProjects = admin
		? await projectsQuery.all()
		: await projectsQuery.where(eq(projects.createdBy, userName)).all();

	// Convert cents → decimals for UI
	const allProjects = rawProjects.map(p => ({
		...p,
		budgetAmount: (p.budgetAmountCents || 0) / 1000,
		spentAmount: (p.spentAmountCents || 0) / 1000
	}));

	// Filter clients for dropdown if non-admin
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

	return {
		workflows,
		projects: allProjects,
		clients: allClients
	};
};

export const actions = {
	updateProjectStep: async ({ request, locals }) => {
		const data = await request.formData();
		const projectId = parseInt(data.get('projectId')?.toString() || '0');
		const workflowName = data.get('workflowName')?.toString(); // This is the new status value

		if (!projectId || !workflowName) {
			return fail(400, { missing: true });
		}

		// Retrieve project to validate existence and access
		const proj = await locals.db.select().from(projects).where(eq(projects.id, projectId)).get();
		if (!proj) {
			return fail(404, { error: 'Projet introuvable' });
		}

		// Security: Non-admin can only update their own projects
		if (!isAdmin(locals) && proj.createdBy !== locals.user?.userName) {
			return fail(403, { forbidden: true });
		}

		// Validate that the status is one of the allowed values
		const allowedStatuses = [
			'NEW_PROJECT',
			'IN_PROGRESS',
			'PENDING_VALIDATION',
			'READY_TO_PRINT',
			'PRINTED',
			'DELIVERED',
			'PENDING_PAYMENT',
			'CANCELLED'
		];

		if (!allowedStatuses.includes(workflowName)) {
			return fail(400, { error: 'Statut invalide' });
		}

		await locals.db
			.update(projects)
			.set({
				statusProject: workflowName,
				updatedAt: new Date().toISOString()
			})
			.where(eq(projects.id, projectId));

		return { success: true };
	}
};
