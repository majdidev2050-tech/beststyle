import { projects, clients, payments, clientUserAccess } from '$lib/server/db/schema';
import { count, ne, and, eq, inArray } from 'drizzle-orm';

const isAdmin = (locals: App.Locals) => locals.user?.role === 'SUPER_ADMIN' || locals.user?.role === 'ADMIN';
const isClientRole = (locals: App.Locals) => locals.user?.role === 'CLIENT';

const hasPaymentAccess = (locals: App.Locals) => {
	if (isAdmin(locals)) return true;
	const role = locals.user?.role?.toUpperCase();
	return role === 'PROJET+PAIEMENT' || role === 'PROJECT_PAYMENT' || role === 'PROJECT+PAYMENT';
};

export const load = async ({ locals }) => {
	const userName = locals.user?.userName || '';
	const admin = isAdmin(locals);
	const isClient = isClientRole(locals);

	let activeProjectsCount = 0;
	let totalPaymentsCount = 0;
	let totalClientsCount = 0;

	if (locals.db) {
		try {
			// 1. Projets actifs
			if (admin) {
				const activeProjectsRes = await locals.db
					.select({ value: count() })
					.from(projects)
					.where(and(ne(projects.statusProject, 'COMPLETED'), ne(projects.statusProject, 'CANCELLED')))
					.get();
				activeProjectsCount = activeProjectsRes?.value || 0;
			} else if (isClient) {
				// Récupérer les clients autorisés via la table de liaison
				const accessRows = await locals.db
					.select({ clientId: clientUserAccess.clientId })
					.from(clientUserAccess)
					.where(eq(clientUserAccess.userName, userName))
					.all();
				const allowedClientIds = accessRows.map(r => r.clientId);

				if (allowedClientIds.length > 0) {
					const activeProjectsRes = await locals.db
						.select({ value: count() })
						.from(projects)
						.where(and(
							ne(projects.statusProject, 'COMPLETED'),
							ne(projects.statusProject, 'CANCELLED'),
							inArray(projects.clientId, allowedClientIds)
						))
						.get();
					activeProjectsCount = activeProjectsRes?.value || 0;
				}
			} else {
				const activeProjectsRes = await locals.db
					.select({ value: count() })
					.from(projects)
					.where(and(
						ne(projects.statusProject, 'COMPLETED'),
						ne(projects.statusProject, 'CANCELLED'),
						eq(projects.createdBy, userName)
					))
					.get();
				activeProjectsCount = activeProjectsRes?.value || 0;
			}

			// 2. Paiements en attente
			if (admin) {
				const paymentsRes = await locals.db
					.select({ value: count() })
					.from(payments)
					.where(ne(payments.statusPayment, 'PAID'))
					.get();
				totalPaymentsCount = paymentsRes?.value || 0;
			} else if (hasPaymentAccess(locals)) {
				// Récupérer les projets créés par l'utilisateur
				const myProjects = await locals.db
					.select({ id: projects.id })
					.from(projects)
					.where(eq(projects.createdBy, userName))
					.all();
				const myProjectIds = myProjects.map(p => p.id);

				if (myProjectIds.length > 0) {
					const paymentsRes = await locals.db
						.select({ value: count() })
						.from(payments)
						.where(and(
							ne(payments.statusPayment, 'PAID'),
							inArray(payments.projectId, myProjectIds)
						))
						.get();
					totalPaymentsCount = paymentsRes?.value || 0;
				}
			}

			// 3. Total clients
			if (admin) {
				const clientsRes = await locals.db
					.select({ value: count() })
					.from(clients)
					.get();
				totalClientsCount = clientsRes?.value || 0;
			} else {
				const accessRows = await locals.db
					.select({ clientId: clientUserAccess.clientId })
					.from(clientUserAccess)
					.where(eq(clientUserAccess.userName, userName))
					.all();
				totalClientsCount = accessRows.length;
			}
		} catch (err) {
			console.error('Failed to load dashboard statistics:', err);
		}
	}

	return {
		user: locals.user,
		stats: {
			activeProjects: activeProjectsCount,
			pendingPayments: totalPaymentsCount,
			totalClients: totalClientsCount
		}
	};
};
