-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id            integer PRIMARY KEY AUTOINCREMENT,
    user_name     text    NOT NULL UNIQUE,
    first_name    text    NOT NULL,
    last_name     text    NOT NULL,
    email         text    NOT NULL UNIQUE,
    password_hash text,
    avatar_url    text,
    role          text    DEFAULT 'EMPLOYEE' NOT NULL
                    CHECK (role IN ('EMPLOYEE', 'MANAGER', 'ADMIN')),
    is_active     integer DEFAULT 1 NOT NULL CHECK (is_active IN (0, 1)),
    last_login_at text,
    created_at    text    DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
    updated_at    text    DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);

CREATE INDEX users_email_idx ON users (email);

-- Trigger updated_at
CREATE TRIGGER users_updated_at AFTER UPDATE ON users FOR EACH ROW
BEGIN UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

-- ============================================================
-- CLIENTS
-- ============================================================
CREATE TABLE clients (
    id              integer PRIMARY KEY AUTOINCREMENT,
    company_name    text    NOT NULL UNIQUE,
    contact_name    text,
	user_login      text    UNIQUE,
    password_hash   text,
    is_active       integer DEFAULT 1 NOT NULL CHECK (is_active IN (0, 1)),
    contact_email   text,
    contact_phone   text,
    billing_address text,
    vat_number      text,
    notes           text,
    created_by      text    NOT NULL,
    created_at      text    DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
    updated_at      text    DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
    uuid            text    NOT NULL UNIQUE,
	 CHECK (
        (user_login IS NULL AND password_hash IS NULL)
        OR
        (user_login IS NOT NULL AND password_hash IS NOT NULL)
    )
);
CREATE INDEX clients_login_idx ON clients (user_login) WHERE user_login IS NOT NULL;
-- Trigger updated_at
CREATE TRIGGER clients_updated_at AFTER UPDATE ON clients FOR EACH ROW
BEGIN UPDATE clients SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

-- Table de liaison accès utilisateur (remplace users_access text)
CREATE TABLE client_user_access (
    client_id integer NOT NULL,
    user_name text    NOT NULL,
    PRIMARY KEY (client_id, user_name),
    FOREIGN KEY (client_id) REFERENCES clients(id)       ON DELETE CASCADE,
    FOREIGN KEY (user_name) REFERENCES users(user_name)   ON DELETE CASCADE
);
CREATE INDEX idx_cua_user ON client_user_access (user_name);

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE projects (
    id                  integer PRIMARY KEY AUTOINCREMENT,
    client_id           integer NOT NULL,

    -- 📸 Snapshot client : figé au moment de la création du projet
    -- Ces champs ne sont PAS mis à jour si le client change d'info
    company_name        text    NOT NULL,
    contact_name        text,
    contact_email       text,

    project_name        text    NOT NULL UNIQUE,
    description         text,
    status_project      text    DEFAULT 'NEW_PROJECT' NOT NULL
                        CHECK (status_project IN ('NEW_PROJECT','IN_PROGRESS','PENDING_VALIDATION','READY_TO_PRINT','PRINTED','DELIVERED','PENDING_PAYMENT','CANCELLED')),
    priority            text    DEFAULT 'MEDIUM' NOT NULL
                        CHECK (priority IN ('LOW','MEDIUM','HIGH','URGENT')),
    budget_amount_cents integer DEFAULT 0,
    spent_amount_cents  integer DEFAULT 0,
    progress_percentage integer DEFAULT 0 NOT NULL
                        CHECK (progress_percentage BETWEEN 0 AND 100),
    start_date          text    DEFAULT (current_date),
    due_date            text,
    completed_at        text,
    reference           text,
    created_by          text    NOT NULL,
    user_name           text    NOT NULL,
    created_at          text    DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
    updated_at          text    DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
    uuid                text    NOT NULL UNIQUE,
    FOREIGN KEY (client_id)  REFERENCES clients(id)       ON DELETE RESTRICT
);

CREATE INDEX projects_status_idx   ON projects (status_project);
CREATE INDEX projects_created_idx  ON projects (created_at);
CREATE INDEX projects_client_idx   ON projects (client_id);

-- Trigger updated_at
CREATE TRIGGER projects_updated_at AFTER UPDATE ON projects FOR EACH ROW
BEGIN UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE payments (
    id                  integer PRIMARY KEY AUTOINCREMENT,
    project_id          integer NOT NULL,
    client_id           integer NOT NULL,

    -- 📸 Snapshots figés au moment du paiement
    company_name        text    NOT NULL,
    contact_name        text,
    contact_email       text,
    project_name        text    NOT NULL,

    amount_cents        integer DEFAULT 0 NOT NULL,
    payment_type        text    DEFAULT 'ESPECE' NOT NULL
                        CHECK (payment_type IN ('ESPECE','VIREMENT','CHEQUE','CARTE','OTHER')),
    status_payment      text    DEFAULT 'PENDING' NOT NULL
                        CHECK (status_payment IN ('PENDING','PAID','OVERDUE','CANCELLED')),
    invoice_number      text,
    payment_date        text,
    due_date            text,
    notes               text,
    created_by          text    NOT NULL,
    created_at          text    DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
    updated_at          text    DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
    uuid                text    NOT NULL UNIQUE,
    FOREIGN KEY (project_id) REFERENCES projects(id)       ON DELETE RESTRICT,
    FOREIGN KEY (client_id) REFERENCES clients(id)         ON DELETE RESTRICT
);

CREATE INDEX payments_created_idx  ON payments (created_at);
CREATE INDEX payments_status_idx   ON payments (status_payment);
CREATE INDEX payments_client_idx   ON payments (client_id);
CREATE INDEX payments_project_idx  ON payments (project_id);

-- Trigger updated_at
CREATE TRIGGER payments_updated_at AFTER UPDATE ON payments FOR EACH ROW
BEGIN UPDATE payments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

-- ============================================================
-- FTS5 — Recherche plein texte (remplace search_text + B-tree)
-- ============================================================
CREATE VIRTUAL TABLE clients_fts USING fts5(
    company_name, contact_name, contact_email,
    contact_phone, billing_address, vat_number,
    content=clients, content_rowid=id
);
CREATE VIRTUAL TABLE projects_fts USING fts5(
    project_name, description, reference, company_name,
    content=projects, content_rowid=id
);
CREATE VIRTUAL TABLE payments_fts USING fts5(
    invoice_number, notes, company_name, project_name,
    content=payments, content_rowid=id
);
CREATE VIRTUAL TABLE users_fts USING fts5(
    user_name, first_name, last_name, email,
    content=users, content_rowid=id
);

-- Triggers FTS5 — clients
CREATE TRIGGER clients_fts_ins AFTER INSERT ON clients FOR EACH ROW
BEGIN
  INSERT INTO clients_fts(rowid, company_name, contact_name, contact_email, contact_phone, billing_address, vat_number)
  VALUES (NEW.id, NEW.company_name, NEW.contact_name, NEW.contact_email, NEW.contact_phone, NEW.billing_address, NEW.vat_number);
END;
CREATE TRIGGER clients_fts_del AFTER DELETE ON clients FOR EACH ROW
BEGIN
  INSERT INTO clients_fts(clients_fts, rowid, company_name, contact_name, contact_email, contact_phone, billing_address, vat_number)
  VALUES ('delete', OLD.id, OLD.company_name, OLD.contact_name, OLD.contact_email, OLD.contact_phone, OLD.billing_address, OLD.vat_number);
END;
CREATE TRIGGER clients_fts_upd AFTER UPDATE ON clients FOR EACH ROW
BEGIN
  INSERT INTO clients_fts(clients_fts, rowid, company_name, contact_name, contact_email, contact_phone, billing_address, vat_number)
  VALUES ('delete', OLD.id, OLD.company_name, OLD.contact_name, OLD.contact_email, OLD.contact_phone, OLD.billing_address, OLD.vat_number);
  INSERT INTO clients_fts(rowid, company_name, contact_name, contact_email, contact_phone, billing_address, vat_number)
  VALUES (NEW.id, NEW.company_name, NEW.contact_name, NEW.contact_email, NEW.contact_phone, NEW.billing_address, NEW.vat_number);
END;

-- Triggers FTS5 — projects
CREATE TRIGGER projects_fts_ins AFTER INSERT ON projects FOR EACH ROW
BEGIN
  INSERT INTO projects_fts(rowid, project_name, description, reference, company_name)
  VALUES (NEW.id, NEW.project_name, NEW.description, NEW.reference, NEW.company_name);
END;
CREATE TRIGGER projects_fts_del AFTER DELETE ON projects FOR EACH ROW
BEGIN
  INSERT INTO projects_fts(projects_fts, rowid, project_name, description, reference, company_name)
  VALUES ('delete', OLD.id, OLD.project_name, OLD.description, OLD.reference, OLD.company_name);
END;
CREATE TRIGGER projects_fts_upd AFTER UPDATE ON projects FOR EACH ROW
BEGIN
  INSERT INTO projects_fts(projects_fts, rowid, project_name, description, reference, company_name)
  VALUES ('delete', OLD.id, OLD.project_name, OLD.description, OLD.reference, OLD.company_name);
  INSERT INTO projects_fts(rowid, project_name, description, reference, company_name)
  VALUES (NEW.id, NEW.project_name, NEW.description, NEW.reference, NEW.company_name);
END;

-- Triggers FTS5 — payments
CREATE TRIGGER payments_fts_ins AFTER INSERT ON payments FOR EACH ROW
BEGIN
  INSERT INTO payments_fts(rowid, invoice_number, notes, company_name, project_name)
  VALUES (NEW.id, NEW.invoice_number, NEW.notes, NEW.company_name, NEW.project_name);
END;
CREATE TRIGGER payments_fts_del AFTER DELETE ON payments FOR EACH ROW
BEGIN
  INSERT INTO payments_fts(payments_fts, rowid, invoice_number, notes, company_name, project_name)
  VALUES ('delete', OLD.id, OLD.invoice_number, OLD.notes, OLD.company_name, OLD.project_name);
END;
CREATE TRIGGER payments_fts_upd AFTER UPDATE ON payments FOR EACH ROW
BEGIN
  INSERT INTO payments_fts(payments_fts, rowid, invoice_number, notes, company_name, project_name)
  VALUES ('delete', OLD.id, OLD.invoice_number, OLD.notes, OLD.company_name, OLD.project_name);
  INSERT INTO payments_fts(rowid, invoice_number, notes, company_name, project_name)
  VALUES (NEW.id, NEW.invoice_number, NEW.notes, NEW.company_name, NEW.project_name);
END;

-- Triggers FTS5 — users
CREATE TRIGGER users_fts_ins AFTER INSERT ON users FOR EACH ROW
BEGIN
  INSERT INTO users_fts(rowid, user_name, first_name, last_name, email)
  VALUES (NEW.id, NEW.user_name, NEW.first_name, NEW.last_name, NEW.email);
END;
CREATE TRIGGER users_fts_del AFTER DELETE ON users FOR EACH ROW
BEGIN
  INSERT INTO users_fts(users_fts, rowid, user_name, first_name, last_name, email)
  VALUES ('delete', OLD.id, OLD.user_name, OLD.first_name, OLD.last_name, OLD.email);
END;
CREATE TRIGGER users_fts_upd AFTER UPDATE ON users FOR EACH ROW
BEGIN
  INSERT INTO users_fts(users_fts, rowid, user_name, first_name, last_name, email)
  VALUES ('delete', OLD.id, OLD.user_name, OLD.first_name, OLD.last_name, OLD.email);
  INSERT INTO users_fts(rowid, user_name, first_name, last_name, email)
  VALUES (NEW.id, NEW.user_name, NEW.first_name, NEW.last_name, NEW.email);
END;

-- ============================================================
-- PHOTOS
-- ============================================================

-- ============================================================
-- PHOTOS
-- ============================================================
CREATE TABLE photos_projects (
    id          text PRIMARY KEY NOT NULL,
    project_id  integer NOT NULL,
    filename    text    NOT NULL,
    description text,
    r2_key      text    NOT NULL,
    url         text    NOT NULL,
    created_at  text    DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
    updated_at  text    DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE VIRTUAL TABLE photos_fts USING fts5(
    filename, description,
    content=photos_projects, content_rowid=rowid
);

CREATE TRIGGER photos_fts_ins AFTER INSERT ON photos_projects FOR EACH ROW
BEGIN
  INSERT INTO photos_fts(rowid, filename, description)
  VALUES (NEW.rowid, NEW.filename, NEW.description);
END;
CREATE TRIGGER photos_fts_del AFTER DELETE ON photos_projects FOR EACH ROW
BEGIN
  INSERT INTO photos_fts(photos_fts, rowid, filename, description)
  VALUES ('delete', OLD.rowid, OLD.filename, OLD.description);
END;
CREATE TRIGGER photos_fts_upd AFTER UPDATE ON photos_projects FOR EACH ROW
BEGIN
  INSERT INTO photos_fts(photos_fts, rowid, filename, description)
  VALUES ('delete', OLD.rowid, OLD.filename, OLD.description);
  INSERT INTO photos_fts(rowid, filename, description)
  VALUES (NEW.rowid, NEW.filename, NEW.description);
END;

-- Trigger updated_at
CREATE TRIGGER photos_updated_at AFTER UPDATE ON photos_projects FOR EACH ROW
BEGIN UPDATE photos_projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;