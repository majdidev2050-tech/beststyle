import { projects, clients } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

const isClientRole = (locals: App.Locals) => locals.user?.role === 'CLIENT';

const matchesUserAccess = (usersAccessVal: string | null | undefined, userName: string): boolean => {
	if (!usersAccessVal) return false;
	const trimmed = usersAccessVal.trim();
	if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
		try {
			const parsed = JSON.parse(trimmed);
			if (Array.isArray(parsed)) {
				return parsed.map((p) => p.toString().toLowerCase()).includes(userName.toLowerCase());
			}
		} catch (e) {
			// ignore JSON parse errors
		}
	}
	// Fallback : séparation par espaces/virgules/points-virgules
	const parts = trimmed.split(/[\s,;]+/).map((p) => p.trim().toLowerCase());
	return parts.includes(userName.toLowerCase());
};

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

	// Trouver les clients dont le userName de l'utilisateur est dans users_access
	const allClients = await locals.db.select().from(clients).all();
	const allowedClients = allClients.filter((c) => matchesUserAccess(c.usersAccess, userName));
	const allowedClientIds = allowedClients.map((c) => c.id);

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
		budgetAmount: projects.budgetAmount,
		spentAmount: projects.spentAmount,
		progressPercentage: projects.progressPercentage,
		startDate: projects.startDate,
		dueDate: projects.dueDate,
		completedAt: projects.completedAt,
		workflowName: projects.workflowName,
		reference: projects.reference,
		clientId: projects.clientId,
		createdAt: projects.createdAt,
		updatedAt: projects.updatedAt,
		clientCompanyName: clients.companyName
	};

	let myProjects;

	if (allowedClientIds.length === 1) {
		myProjects = await locals.db
			.select(selectedFields)
			.from(projects)
			.leftJoin(clients, eq(projects.clientId, clients.id))
			.where(eq(projects.clientId, allowedClientIds[0]))
			.all();
	} else {
		myProjects = await locals.db
			.select(selectedFields)
			.from(projects)
			.leftJoin(clients, eq(projects.clientId, clients.id))
			.where(inArray(projects.clientId, allowedClientIds))
			.all();
	}

	return { projects: myProjects, clientName };
};
