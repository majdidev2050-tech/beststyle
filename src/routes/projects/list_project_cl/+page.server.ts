import { projects, clients, clientUserAccess } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

const isClientRole = (locals: App.Locals) => locals.user?.role === 'CLIENT';

export const load = async ({ locals }: { locals: App.Locals }) => {
	// Authentification obligatoire
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	// Seuls les users avec rôle CLIENT accèdent à cette interface
	// Les membres de l'équipe (ADMIN, SUPER_ADMIN, EMPLOYEE) sont redirigés vers /projects
	if (!isClientRole(locals)) {
		throw redirect(303, '/projects');
	}

	const userName = locals.user.userName;
	const clientName = `${locals.user.firstName} ${locals.user.lastName}`;

	// Trouver les clients dont le userName de l'utilisateur est dans la table de liaison
	const accessRows = await locals.db
		.select({ clientId: clientUserAccess.clientId })
		.from(clientUserAccess)
		.where(eq(clientUserAccess.userName, userName))
		.all();
	const allowedClientIds = accessRows.map(r => r.clientId);

	// Aucun client autorisé → liste vide
	if (allowedClientIds.length === 0) {
		return { projects: [], clientName };
	}

	// Récupérer les projets des clients autorisés (lecture seule)
	const selectedFields = {
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
		clientId: projects.clientId,
		createdAt: projects.createdAt,
		updatedAt: projects.updatedAt,
		clientCompanyName: clients.companyName
	};

	let rawProjects;

	if (allowedClientIds.length === 1) {
		rawProjects = await locals.db
			.select(selectedFields)
			.from(projects)
			.leftJoin(clients, eq(projects.clientId, clients.id))
			.where(eq(projects.clientId, allowedClientIds[0]))
			.all();
	} else {
		rawProjects = await locals.db
			.select(selectedFields)
			.from(projects)
			.leftJoin(clients, eq(projects.clientId, clients.id))
			.where(inArray(projects.clientId, allowedClientIds))
			.all();
	}

	// Convertir cents → décimaux pour l'UI
	const myProjects = rawProjects.map(p => ({
		...p,
		budgetAmount: (p.budgetAmountCents || 0) / 1000,
		spentAmount: (p.spentAmountCents || 0) / 1000
	}));

	return { projects: myProjects, clientName };
};
