import { workflowProjects, projects, clients } from '$lib/server/db/schema';
import { eq, asc, lt, gt } from 'drizzle-orm';
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

export const load = async ({ locals }) => {
	const userName = locals.user?.userName || '';
	const admin = isAdmin(locals);

	// 1. Récupérer toutes les étapes de workflow (triées par position)
	let allWorkflows = await locals.db
		.select()
		.from(workflowProjects)
		.orderBy(asc(workflowProjects.position))
		.all();

	// 2. Bootstrap des workflows par défaut si vides
	if (allWorkflows.length === 0) {
		const defaults = [
			{ id: crypto.randomUUID(), position: 1, workflowName: 'BACKLOG' },
			{ id: crypto.randomUUID(), position: 2, workflowName: 'TODO' },
			{ id: crypto.randomUUID(), position: 3, workflowName: 'IN PROGRESS' },
			{ id: crypto.randomUUID(), position: 4, workflowName: 'IN REVIEW' },
			{ id: crypto.randomUUID(), position: 5, workflowName: 'DONE' }
		];

		for (const d of defaults) {
			await locals.db.insert(workflowProjects).values(d);
		}

		allWorkflows = await locals.db
			.select()
			.from(workflowProjects)
			.orderBy(asc(workflowProjects.position))
			.all();
	}

	// 3. Récupérer tous les projets avec nom de client dénormalisé
	const projectsQuery = locals.db
		.select({
			id: projects.id,
			uuid: projects.uuid,
			projectName: projects.projectName,
			companyName: projects.companyName,
			description: projects.description,
			statusProject: projects.statusProject,
			workflowName: projects.workflowName,
			priority: projects.priority,
			budgetAmount: projects.budgetAmount,
			spentAmount: projects.spentAmount,
			progressPercentage: projects.progressPercentage,
			startDate: projects.startDate,
			dueDate: projects.dueDate,
			clientId: projects.clientId,
			createdBy: projects.createdBy,
			clientCompanyName: clients.companyName
		})
		.from(projects)
		.leftJoin(clients, eq(projects.clientId, clients.id));

	// Les non-admins ne voient que les projets créés par eux-mêmes
	const allProjects = admin
		? await projectsQuery.all()
		: await projectsQuery.where(eq(projects.createdBy, userName)).all();

	// Filtrer les clients pour le menu déroulant si non-admin
	const rawClients = await locals.db.select().from(clients).all();
	const allClients = admin
		? rawClients
		: rawClients.filter(c => matchesUserAccess(c.usersAccess, userName));

	return {
		workflows: allWorkflows,
		projects: allProjects,
		clients: allClients
	};
};

export const actions = {
	updateProjectStep: async ({ request, locals }) => {
		const data = await request.formData();
		const projectId = parseInt(data.get('projectId')?.toString() || '0');
		const workflowName = data.get('workflowName')?.toString();

		if (!projectId || !workflowName) {
			return fail(400, { missing: true });
		}

		// Récupérer le projet pour valider l'existence et l'accès
		const proj = await locals.db.select().from(projects).where(eq(projects.id, projectId)).get();
		if (!proj) {
			return fail(404, { error: 'Projet introuvable' });
		}

		// Sécurité : Si non-admin, on ne peut mettre à jour que ses propres projets
		if (!isAdmin(locals) && proj.createdBy !== locals.user?.userName) {
			return fail(403, { forbidden: true });
		}

		await locals.db
			.update(projects)
			.set({
				workflowName,
				updatedAt: new Date().toISOString()
			})
			.where(eq(projects.id, projectId));

		return { success: true };
	},

	createWorkflowStep: async ({ request, locals }) => {
		if (!isAdmin(locals)) {
			return fail(403, { forbidden: true });
		}
		const data = await request.formData();
		const name = data.get('workflowName')?.toString();

		if (!name) {
			return fail(400, { missing: true });
		}

		const upperName = name.toUpperCase().trim();

		// Récupérer la position max pour ajouter à la fin
		const currentWorkflows = await locals.db
			.select()
			.from(workflowProjects)
			.all();
		const nextPosition = currentWorkflows.length > 0
			? Math.max(...currentWorkflows.map(w => w.position)) + 1
			: 1;

		await locals.db.insert(workflowProjects).values({
			id: crypto.randomUUID(),
			position: nextPosition,
			workflowName: upperName
		});

		return { success: true };
	},

	renameWorkflowStep: async ({ request, locals }) => {
		if (!isAdmin(locals)) {
			return fail(403, { forbidden: true });
		}
		const data = await request.formData();
		const id = data.get('id')?.toString();
		const newName = data.get('workflowName')?.toString();

		if (!id || !newName) {
			return fail(400, { missing: true });
		}

		const upperNewName = newName.toUpperCase().trim();

		// Trouver l'ancien nom pour migrer les projets
		const oldStep = await locals.db
			.select()
			.from(workflowProjects)
			.where(eq(workflowProjects.id, id))
			.get();

		if (oldStep) {
			// Renommer l'étape
			await locals.db
				.update(workflowProjects)
				.set({ workflowName: upperNewName })
				.where(eq(workflowProjects.id, id));

			// Mettre à jour tous les projets dans l'ancienne étape
			await locals.db
				.update(projects)
				.set({ workflowName: upperNewName })
				.where(eq(projects.workflowName, oldStep.workflowName));
		}

		return { success: true };
	},

	moveWorkflowStep: async ({ request, locals }) => {
		if (!isAdmin(locals)) {
			return fail(403, { forbidden: true });
		}
		const data = await request.formData();
		const id = data.get('id')?.toString();
		const direction = data.get('direction')?.toString(); // 'left' or 'right'

		if (!id || !direction) {
			return fail(400, { missing: true });
		}

		// Trouver la colonne courante
		const currentColumn = await locals.db
			.select()
			.from(workflowProjects)
			.where(eq(workflowProjects.id, id))
			.get();

		if (!currentColumn) {
			return fail(404, { notFound: true });
		}

		let targetColumn = null;

		if (direction === 'left') {
			// Colonne avec la plus grande position < position courante
			const columns = await locals.db
				.select()
				.from(workflowProjects)
				.where(lt(workflowProjects.position, currentColumn.position))
				.orderBy(asc(workflowProjects.position))
				.all();
			if (columns.length > 0) {
				targetColumn = columns[columns.length - 1];
			}
		} else if (direction === 'right') {
			// Colonne avec la plus petite position > position courante
			const columns = await locals.db
				.select()
				.from(workflowProjects)
				.where(gt(workflowProjects.position, currentColumn.position))
				.orderBy(asc(workflowProjects.position))
				.all();
			if (columns.length > 0) {
				targetColumn = columns[0];
			}
		}

		if (targetColumn) {
			// Échanger les positions
			const tempPos = currentColumn.position;
			await locals.db
				.update(workflowProjects)
				.set({ position: targetColumn.position })
				.where(eq(workflowProjects.id, currentColumn.id));

			await locals.db
				.update(workflowProjects)
				.set({ position: tempPos })
				.where(eq(workflowProjects.id, targetColumn.id));
		}

		return { success: true };
	},

	deleteWorkflowStep: async ({ request, locals }) => {
		if (!isAdmin(locals)) {
			return fail(403, { forbidden: true });
		}
		const data = await request.formData();
		const id = data.get('id')?.toString();

		if (!id) {
			return fail(400, { missing: true });
		}

		// Trouver l'étape pour remettre les projets affectés en BACKLOG
		const step = await locals.db
			.select()
			.from(workflowProjects)
			.where(eq(workflowProjects.id, id))
			.get();

		if (step) {
			await locals.db.delete(workflowProjects).where(eq(workflowProjects.id, id));

			// Remettre les projets de cette étape en 'BACKLOG'
			await locals.db
				.update(projects)
				.set({ workflowName: 'BACKLOG' })
				.where(eq(projects.workflowName, step.workflowName));
		}

		return { success: true };
	}
};
