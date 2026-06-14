CREATE TABLE `clients` (
	`id` INTEGER PRIMARY KEY AUTOINCREMENT,
	`company_name` text NOT NULL,
	`contact_name` text,
	`contact_email` text,
	`user_login` text,
	`password_hash` text,
	`contact_phone` text,
	`billing_address` text,
	`vat_number` text,
	`notes` text,
	`created_by` text,
	`users_access` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`uuid` text NOT NULL,
	`search_text` TEXT GENERATED ALWAYS AS (
     CAST(id AS TEXT) || ' ' ||
     company_name || ' ' ||
     contact_name || ' ' ||
     contact_email || ' ' ||
     contact_phone || ' ' ||
     billing_address || ' ' ||
     vat_number
     ) STORED,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`user_name`) ON UPDATE no action ON DELETE no action
);
CREATE UNIQUE INDEX `clients_username_unique` ON `clients` (`company_name`);
CREATE UNIQUE INDEX `clients_useraccess_unique` ON `clients` (`users_access`);
CREATE UNIQUE INDEX `clients_uuid_unique` ON `clients` (`uuid`);
CREATE INDEX `clients_users_access_idx` ON `clients` (`users_access`);
CREATE INDEX `clients_uuid_idx` ON `clients` (`uuid`);

--> statement-breakpoint
CREATE TABLE `payments` (
	`id` INTEGER PRIMARY KEY AUTOINCREMENT,
	`project_id` text NOT NULL,
	`client_id` text NOT NULL,
	`company_name` text NOT NULL,
	`contact_name` text,
	`contact_email` text,
	`project_name` text NOT NULL,
	`amount` real DEFAULT 0 NOT NULL,
	`payment_type` text DEFAULT 'ESPECE' NOT NULL,
	`status_payment` text DEFAULT 'PENDING' NOT NULL,
	`invoice_number` text,
	`payment_date` text,
	`due_date` text,
	`notes` text,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`uuid` text NOT NULL,
	`search_text` TEXT GENERATED ALWAYS AS (
     CAST(id AS TEXT) || ' ' ||
	 company_name || ' ' ||
	 contact_name || ' ' ||
	 contact_email || ' ' ||
	 project_name || ' ' ||
     payment_type || ' ' ||
     status_payment || ' ' ||
     CAST(amount AS TEXT) || ' ' ||
     invoice_number
     ) STORED,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`user_name`) ON UPDATE no action ON DELETE no action
);

CREATE UNIQUE INDEX `payments_uuid_unique` ON `payments` (`uuid`);
CREATE INDEX `payments_created_at_idx` ON `payments` (`created_at`);

--> statement-breakpoint
CREATE TABLE `projects` (
	`id` INTEGER PRIMARY KEY AUTOINCREMENT,
	`client_id` integer NOT NULL,
    `company_name` text NOT NULL,
	`contact_name` text,
	`contact_email` text,
	`project_name` text NOT NULL,
	`description` text,
	`status_project` text DEFAULT 'PLANNING' NOT NULL,
	`workflow_name` text DEFAULT 'TODO' NOT NULL,
	`priority` text DEFAULT 'MEDIUM' NOT NULL,
	`budget_amount` real DEFAULT 0,
	`spent_amount` real DEFAULT 0,
	`progress_percentage` integer DEFAULT 0 NOT NULL,
	`start_date` text DEFAULT (current_date),
	`due_date` text,
	`completed_at` text,
	`reference` text,
	`created_by` text NOT NULL,
	`user_name` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`uuid` text NOT NULL,
	`search_text` TEXT GENERATED ALWAYS AS (
     CAST(id AS TEXT) || ' ' ||
     CAST(client_id AS TEXT) || ' ' ||
	 company_name || ' ' ||
	 contact_name || ' ' ||
	 contact_email || ' ' ||
	 project_name || ' ' ||
	 user_name || ' ' ||
     status_project || ' ' ||
     workflow_name || ' ' ||
     priority || ' ' ||
     reference
     ) STORED,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`user_name`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_name_unique` ON `projects` (`project_name`);--> statement-breakpoint
CREATE UNIQUE INDEX `projects_uuid_unique` ON `projects` (`uuid`);
CREATE INDEX `projects_created_at_idx` ON `projects` (`created_at`);
CREATE INDEX `projects_workflow_name_idx` ON `projects` (`workflow_name`);
CREATE INDEX `projects_status_project_idx` ON `projects` (`status_project`);
CREATE INDEX `projects_priority_idx` ON `projects` (`priority`);

CREATE TABLE `users` (
	`user_name` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text,
	`avatar_url` text,
	`role` text DEFAULT 'EMPLOYEE' NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`search_text` TEXT GENERATED ALWAYS AS (
     user_name || ' ' ||
     first_name || ' ' ||
     last_name || ' ' ||
     email || ' ' ||
     role
     ) STORED,
	`last_login_at` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
CREATE INDEX `users_user_name_idx` ON `users` (`user_name`);
CREATE INDEX `users_email_idx` ON `users` (`email`);
--> statement-breakpoint
CREATE TABLE `workflow_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`position` integer NOT NULL,
	`workflow_name` text NOT NULL
);
CREATE TABLE `photos_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` integer NOT NULL,
	`project_name` text NOT NULL,
	`filename` text NOT NULL,
	`description` text,
	`r2_key` text NOT NULL,
	`url` text NOT NULL,
	`search_text` TEXT GENERATED ALWAYS AS (
	 project_name || ' ' ||
     description || ' ' ||
     filename
     ) STORED,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE INDEX `clients_search_text_idx` ON `clients` (`search_text`);
CREATE INDEX `projects_search_text_idx` ON `projects` (`search_text`);
CREATE INDEX `payments_search_text_idx` ON `payments` (`search_text`);
CREATE INDEX `users_search_text_idx` ON `users` (`search_text`);
CREATE INDEX `photos_projects_search_text_idx` ON `photos_projects` (`search_text`);
