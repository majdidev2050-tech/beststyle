import { projects, clients } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load = async ({ locals }) => {
	// locals.client est garanti ici (le hook redirige sinon)
	const clientId = locals.client!.id;

	const myProjects = await locals.db
		.select({
			id: projects.id,
			uuid: projects.uuid,
			projectName: projects.projectName,
			companyName: projects.companyName,
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
			clientId: projects.clientId,
			clientCompanyName: clients.companyName
		})
		.from(projects)
		.leftJoin(clients, eq(projects.clientId, clients.id))
		.where(eq(projects.clientId, clientId))
		.all();

	return {
		client: locals.client,
		projects: myProjects
	};
};
