CREATE TABLE users (
    id TEXT PRIMARY KEY NOT NULL,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE sessions (
    -- sha256 hex of the cookie token; the raw token never touches disk
    token_hash TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
);

CREATE INDEX sessions_user_id ON sessions (user_id);

CREATE TABLE events (
    id TEXT PRIMARY KEY NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    -- RFC 3339 timestamps
    date_time_start TEXT NOT NULL,
    date_time_end TEXT NOT NULL,
    location_name TEXT NOT NULL,
    location_city TEXT NOT NULL,
    location_latitude REAL NOT NULL,
    location_longitude REAL NOT NULL,
    ticket_link TEXT,
    genre TEXT NOT NULL DEFAULT '',
    age_restriction TEXT,
    image_url TEXT,
    image_alt TEXT,
    -- JSON array of acts: [{"artists":[{"name":..,"url":..}],"artistJoiner":..,"time":..}]
    acts TEXT NOT NULL DEFAULT '[]',
    published INTEGER NOT NULL DEFAULT 0,
    created_by TEXT REFERENCES users (id) ON DELETE SET NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX events_date_time_start ON events (date_time_start);
