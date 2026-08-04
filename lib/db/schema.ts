/**
 * Schema migrations, applied in order and tracked with SQLite's
 * `user_version` pragma. Never edit a migration that has shipped — add a
 * new one to the end of the array instead, otherwise existing databases
 * will silently diverge from fresh ones.
 */
export const MIGRATIONS: string[] = [
  // 1 — initial production schema
  `
  CREATE TABLE departments (
    id                 TEXT PRIMARY KEY,
    name               TEXT NOT NULL COLLATE NOCASE,
    head_of_department TEXT NOT NULL DEFAULT '',
    description        TEXT NOT NULL DEFAULT '',
    email              TEXT NOT NULL DEFAULT '',
    phone              TEXT NOT NULL DEFAULT '',
    is_active          INTEGER NOT NULL DEFAULT 1,
    created_at         TEXT NOT NULL,
    updated_at         TEXT NOT NULL
  );
  CREATE UNIQUE INDEX idx_departments_name ON departments (name);

  CREATE TABLE staff (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT '',
    department_id TEXT NOT NULL REFERENCES departments (id) ON DELETE RESTRICT,
    email         TEXT NOT NULL DEFAULT '' COLLATE NOCASE,
    phone         TEXT NOT NULL DEFAULT '',
    is_active     INTEGER NOT NULL DEFAULT 1,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
  );
  CREATE INDEX idx_staff_department ON staff (department_id);
  CREATE UNIQUE INDEX idx_staff_email ON staff (email) WHERE email <> '';

  CREATE TABLE categories (
    id                    TEXT PRIMARY KEY,
    name                  TEXT NOT NULL COLLATE NOCASE,
    kind                  TEXT NOT NULL CHECK (kind IN ('request', 'complaint')),
    default_department_id TEXT REFERENCES departments (id) ON DELETE SET NULL,
    is_active             INTEGER NOT NULL DEFAULT 1,
    sort_order            INTEGER NOT NULL DEFAULT 0,
    created_at            TEXT NOT NULL,
    updated_at            TEXT NOT NULL
  );
  CREATE UNIQUE INDEX idx_categories_name ON categories (name);

  CREATE TABLE users (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('admin', 'supervisor', 'staff')),
    department_id TEXT REFERENCES departments (id) ON DELETE SET NULL,
    is_active     INTEGER NOT NULL DEFAULT 1,
    must_change_password INTEGER NOT NULL DEFAULT 0,
    last_login_at TEXT,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
  );
  CREATE UNIQUE INDEX idx_users_email ON users (email);

  CREATE TABLE sessions (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    user_agent TEXT NOT NULL DEFAULT ''
  );
  CREATE INDEX idx_sessions_user ON sessions (user_id);
  CREATE INDEX idx_sessions_expires ON sessions (expires_at);

  CREATE TABLE requests (
    id                TEXT PRIMARY KEY,
    reference_number  TEXT NOT NULL,
    kind              TEXT NOT NULL CHECK (kind IN ('request', 'complaint')),
    citizen_name      TEXT NOT NULL,
    phone             TEXT NOT NULL DEFAULT '',
    email             TEXT NOT NULL DEFAULT '',
    category_id       TEXT NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
    department_id     TEXT REFERENCES departments (id) ON DELETE SET NULL,
    assigned_staff_id TEXT REFERENCES staff (id) ON DELETE SET NULL,
    location          TEXT NOT NULL DEFAULT '',
    description       TEXT NOT NULL,
    priority          TEXT NOT NULL,
    status            TEXT NOT NULL,
    source            TEXT NOT NULL,
    attached_image    TEXT,
    date_submitted    TEXT NOT NULL,
    due_at            TEXT,
    resolved_at       TEXT,
    created_at        TEXT NOT NULL,
    updated_at        TEXT NOT NULL
  );
  CREATE UNIQUE INDEX idx_requests_reference ON requests (reference_number);
  CREATE INDEX idx_requests_kind_date ON requests (kind, date_submitted DESC);
  CREATE INDEX idx_requests_status ON requests (status);
  CREATE INDEX idx_requests_priority ON requests (priority);
  CREATE INDEX idx_requests_department ON requests (department_id);
  CREATE INDEX idx_requests_staff ON requests (assigned_staff_id);
  CREATE INDEX idx_requests_category ON requests (category_id);

  CREATE TABLE request_notes (
    id         TEXT PRIMARY KEY,
    request_id TEXT NOT NULL REFERENCES requests (id) ON DELETE CASCADE,
    author     TEXT NOT NULL,
    note       TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX idx_request_notes_request ON request_notes (request_id, created_at);

  CREATE TABLE request_activity (
    id         TEXT PRIMARY KEY,
    request_id TEXT NOT NULL REFERENCES requests (id) ON DELETE CASCADE,
    actor      TEXT NOT NULL,
    action     TEXT NOT NULL,
    detail     TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );
  CREATE INDEX idx_request_activity_request ON request_activity (request_id, created_at);

  CREATE TABLE notifications (
    id         TEXT PRIMARY KEY,
    request_id TEXT REFERENCES requests (id) ON DELETE SET NULL,
    recipient  TEXT NOT NULL,
    channel    TEXT NOT NULL,
    message    TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX idx_notifications_created ON notifications (created_at DESC);
  CREATE INDEX idx_notifications_request ON notifications (request_id);

  CREATE TABLE api_keys (
    id           TEXT PRIMARY KEY,
    label        TEXT NOT NULL,
    key_hash     TEXT NOT NULL,
    key_preview  TEXT NOT NULL,
    created_by   TEXT NOT NULL DEFAULT '',
    created_at   TEXT NOT NULL,
    last_used_at TEXT,
    revoked_at   TEXT
  );
  CREATE UNIQUE INDEX idx_api_keys_hash ON api_keys (key_hash);

  CREATE TABLE settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE audit_log (
    id          TEXT PRIMARY KEY,
    actor_id    TEXT,
    actor_name  TEXT NOT NULL DEFAULT '',
    action      TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id   TEXT NOT NULL DEFAULT '',
    detail      TEXT NOT NULL DEFAULT '',
    created_at  TEXT NOT NULL
  );
  CREATE INDEX idx_audit_created ON audit_log (created_at DESC);
  CREATE INDEX idx_audit_entity ON audit_log (entity_type, entity_id);

  CREATE TABLE login_attempts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    identifier TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX idx_login_attempts ON login_attempts (identifier, created_at);
  `,
];
