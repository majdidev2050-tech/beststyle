import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ──────────────────────────────────────────────────────────
// USERS
// PK = user_name (TEXT), pas d'UUID sur users
// ──────────────────────────────────────────────────────────
export const users = sqliteTable('users', {
	userName: text('user_name').primaryKey(),
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash'),
	avatarUrl: text('avatar_url'),
	role: text('role').notNull().default('EMPLOYEE'),
	isActive: integer('is_active').notNull().default(1),
	lastLoginAt: text('last_login_at'),
	createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
	updatedAt: text('updated_at').notNull().default('CURRENT_TIMESTAMP'),
	searchText: text('search_text').generatedAlwaysAs(
		sql`user_name || ' ' || first_name || ' ' || last_name || ' ' || email || ' ' || role`,
		{ mode: 'stored' }
	)
});

// ──────────────────────────────────────────────────────────
// CLIENTS
// PK = id (INTEGER AUTOINCREMENT), uuid généré automatiquement
// ──────────────────────────────────────────────────────────
export const clients = sqliteTable('clients', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	companyName: text('company_name').notNull(),
	contactName: text('contact_name'),
	contactEmail: text('contact_email'),
	userLogin: text('user_login'),
	passwordHash: text('password_hash'),
	contactPhone: text('contact_phone'),
	billingAddress: text('billing_address'),
	vatNumber: text('vat_number'),
	notes: text('notes'),
	createdBy: text('created_by').references(() => users.userName),
	usersAccess: text('users_access'),
	createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
	updatedAt: text('updated_at').notNull().default('CURRENT_TIMESTAMP'),
	uuid: text('uuid').notNull().unique(),
	searchText: text('search_text').generatedAlwaysAs(
		sql`CAST(id AS TEXT) || ' ' || company_name || ' ' || contact_name || ' ' || contact_email || ' ' || contact_phone || ' ' || billing_address || ' ' || vat_number`,
		{ mode: 'stored' }
	)
});

// ──────────────────────────────────────────────────────────
// PROJECTS
// PK = id (INTEGER AUTOINCREMENT), uuid généré automatiquement
// ──────────────────────────────────────────────────────────
export const projects = sqliteTable('projects', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	clientId: integer('client_id').notNull().references(() => clients.id),
	companyName: text('company_name').notNull(),
	contactName: text('contact_name'),
	contactEmail: text('contact_email'),
	projectName: text('project_name').notNull(),
	description: text('description'),
	statusProject: text('status_project').notNull().default('PLANNING'),
	workflowName: text('workflow_name').notNull().default('TODO'),
	priority: text('priority').notNull().default('MEDIUM'),
	budgetAmount: real('budget_amount').default(0),
	spentAmount: real('spent_amount').default(0),
	progressPercentage: integer('progress_percentage').notNull().default(0),
	startDate: text('start_date').default(sql`(current_date)`),
	dueDate: text('due_date'),
	completedAt: text('completed_at'),
	reference: text('reference'),
	createdBy: text('created_by').notNull().references(() => users.userName),
	userName: text('user_name').notNull(),
	createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
	updatedAt: text('updated_at').notNull().default('CURRENT_TIMESTAMP'),
	uuid: text('uuid').notNull().unique(),
	searchText: text('search_text').generatedAlwaysAs(
		sql`CAST(id AS TEXT) || ' ' || CAST(client_id AS TEXT) || ' ' || company_name || ' ' || contact_name || ' ' || contact_email || ' ' || project_name || ' ' || user_name || ' ' || status_project || ' ' || workflow_name || ' ' || priority || ' ' || reference`,
		{ mode: 'stored' }
	)
});

// ──────────────────────────────────────────────────────────
// PAYMENTS
// PK = id (INTEGER AUTOINCREMENT), uuid généré automatiquement
// ──────────────────────────────────────────────────────────
export const payments = sqliteTable('payments', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	projectId: text('project_id').notNull().references(() => projects.id),
	clientId: text('client_id').notNull().references(() => clients.id),
	companyName: text('company_name').notNull(),
	contactName: text('contact_name'),
	contactEmail: text('contact_email'),
	projectName: text('project_name').notNull(),
	amount: real('amount').notNull().default(0),
	paymentType: text('payment_type').notNull().default('ESPECE'),
	statusPayment: text('status_payment').notNull().default('PENDING'),
	invoiceNumber: text('invoice_number'),
	paymentDate: text('payment_date'),
	dueDate: text('due_date'),
	notes: text('notes'),
	createdBy: text('created_by').notNull().references(() => users.userName),
	createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
	updatedAt: text('updated_at').notNull().default('CURRENT_TIMESTAMP'),
	uuid: text('uuid').notNull().unique(),
	searchText: text('search_text').generatedAlwaysAs(
		sql`CAST(id AS TEXT) || ' ' || company_name || ' ' || contact_name || ' ' || contact_email || ' ' || project_name || ' ' || payment_type || ' ' || status_payment || ' ' || CAST(amount AS TEXT) || ' ' || invoice_number`,
		{ mode: 'stored' }
	)
});

// ──────────────────────────────────────────────────────────
// WORKFLOW PROJECTS
// ──────────────────────────────────────────────────────────
export const workflowProjects = sqliteTable('workflow_projects', {
	id: text('id').primaryKey(),
	position: integer('position').notNull(),
	workflowName: text('workflow_name').notNull()
});

// ──────────────────────────────────────────────────────────
// PHOTOS PROJECTS
// ──────────────────────────────────────────────────────────
export const photosProjects = sqliteTable('photos_projects', {
	id: text('id').primaryKey(),
	projectId: integer('project_id').notNull().references(() => projects.id),
	projectName: text('project_name').notNull(),
	filename: text('filename').notNull(),
	description: text('description'),
	r2Key: text('r2_key').notNull(),
	url: text('url').notNull(),
	createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
	updatedAt: text('updated_at').notNull().default('CURRENT_TIMESTAMP'),
	searchText: text('search_text').generatedAlwaysAs(
		sql`project_name || ' ' || description || ' ' || filename`,
		{ mode: 'stored' }
	)
});
