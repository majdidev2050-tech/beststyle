import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ──────────────────────────────────────────────────────────
// USERS
// ──────────────────────────────────────────────────────────
export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userName: text('user_name').notNull().unique(),
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash'),
	avatarUrl: text('avatar_url'),
	role: text('role').notNull().default('EMPLOYEE'),
	isActive: integer('is_active').notNull().default(1),
	lastLoginAt: text('last_login_at'),
	createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
	updatedAt: text('updated_at').notNull().default('CURRENT_TIMESTAMP')
});

// ──────────────────────────────────────────────────────────
// CLIENTS
// ──────────────────────────────────────────────────────────
export const clients = sqliteTable('clients', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	companyName: text('company_name').notNull().unique(),
	contactName: text('contact_name'),
	contactEmail: text('contact_email'),
	userLogin: text('user_login').unique(),
	passwordHash: text('password_hash'),
	isActive: integer('is_active').notNull().default(1),
	contactPhone: text('contact_phone'),
	billingAddress: text('billing_address'),
	vatNumber: text('vat_number'),
	notes: text('notes'),
	createdBy: text('created_by').notNull(),
	createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
	updatedAt: text('updated_at').notNull().default('CURRENT_TIMESTAMP'),
	uuid: text('uuid').notNull().unique()
});

// ──────────────────────────────────────────────────────────
// CLIENT USER ACCESS (JOIN TABLE)
// ──────────────────────────────────────────────────────────
export const clientUserAccess = sqliteTable('client_user_access', {
	clientId: integer('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
	userName: text('user_name').notNull().references(() => users.userName, { onDelete: 'cascade' })
}, (table) => [
	primaryKey({ columns: [table.clientId, table.userName] })
]);

// ──────────────────────────────────────────────────────────
// PROJECTS
// ──────────────────────────────────────────────────────────
export const projects = sqliteTable('projects', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	clientId: integer('client_id').notNull().references(() => clients.id, { onDelete: 'restrict' }),
	companyName: text('company_name').notNull(),
	contactName: text('contact_name'),
	contactEmail: text('contact_email'),
	projectName: text('project_name').notNull().unique(),
	description: text('description'),
	statusProject: text('status_project').notNull().default('NEW_PROJECT'),
	priority: text('priority').notNull().default('MEDIUM'),
	budgetAmountCents: integer('budget_amount_cents').default(0),
	spentAmountCents: integer('spent_amount_cents').default(0),
	progressPercentage: integer('progress_percentage').notNull().default(0),
	startDate: text('start_date').default(sql`(current_date)`),
	dueDate: text('due_date'),
	completedAt: text('completed_at'),
	reference: text('reference'),
	createdBy: text('created_by').notNull(),
	userName: text('user_name').notNull(),
	createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
	updatedAt: text('updated_at').notNull().default('CURRENT_TIMESTAMP'),
	uuid: text('uuid').notNull().unique()
});

// ──────────────────────────────────────────────────────────
// PAYMENTS
// ──────────────────────────────────────────────────────────
export const payments = sqliteTable('payments', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'restrict' }),
	clientId: integer('client_id').notNull().references(() => clients.id, { onDelete: 'restrict' }),
	companyName: text('company_name').notNull(),
	contactName: text('contact_name'),
	contactEmail: text('contact_email'),
	projectName: text('project_name').notNull(),
	amountCents: integer('amount_cents').notNull().default(0),
	paymentType: text('payment_type').notNull().default('ESPECE'),
	statusPayment: text('status_payment').notNull().default('PENDING'),
	invoiceNumber: text('invoice_number'),
	paymentDate: text('payment_date'),
	dueDate: text('due_date'),
	notes: text('notes'),
	createdBy: text('created_by').notNull(),
	createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
	updatedAt: text('updated_at').notNull().default('CURRENT_TIMESTAMP'),
	uuid: text('uuid').notNull().unique()
});
// ──────────────────────────────────────────────────────────
// PHOTOS PROJECTS
// ──────────────────────────────────────────────────────────
export const photosProjects = sqliteTable('photos_projects', {
	id: text('id').primaryKey(),
	projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
	filename: text('filename').notNull(),
	description: text('description'),
	r2Key: text('r2_key').notNull(),
	url: text('url').notNull(),
	createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
	updatedAt: text('updated_at').notNull().default('CURRENT_TIMESTAMP')
});
