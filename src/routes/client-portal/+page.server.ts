import { projects, clients } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load = async ({ locals }) => {
	// locals.client est garanti ici (le hook redirige sinon)
	const clientId = locals.client!.id;

	const rawProjects = await locals.db
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
			completedAt: projects.completedAt,
			clientId: projects.clientId,
			clientCompanyName: clients.companyName
		})
		.from(projects)
		.leftJoin(clients, eq(projects.clientId, clients.id))
		.where(eq(projects.clientId, clientId))
		.all();

	// Convertir cents → décimaux pour l'UI
	const myProjects = rawProjects.map(p => ({
		...p,
		budgetAmount: (p.budgetAmountCents || 0) / 1000,
		spentAmount: (p.spentAmountCents || 0) / 1000
	}));

	return {
		client: locals.client,
		projects: myProjects
	};
};
