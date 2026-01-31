-- Schema for Method Passion Booking System
-- Cloudflare D1 (SQLite)

-- Accommodations table
CREATE TABLE IF NOT EXISTS accommodations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description_pt TEXT,
  description_en TEXT,
  description_fr TEXT,
  description_de TEXT,
  description_es TEXT,
  image_url TEXT,
  max_guests INTEGER DEFAULT 10,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  accommodation_id INTEGER NOT NULL,
  check_in TEXT NOT NULL,
  check_out TEXT NOT NULL,
  guests INTEGER NOT NULL,
  nationality TEXT,
  primary_name TEXT NOT NULL,
  additional_names TEXT,
  notes TEXT,
  status TEXT DEFAULT 'confirmed',
  -- Financial fields
  valor REAL DEFAULT 0,
  imposto_municipal REAL DEFAULT 0,
  comissao REAL DEFAULT 0,
  taxa_bancaria REAL DEFAULT 0,
  valor_sem_comissoes REAL DEFAULT 0,
  valor_sem_iva REAL DEFAULT 0,
  iva REAL DEFAULT 0,
  plataforma TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (accommodation_id) REFERENCES accommodations(id)
);

-- Blocked dates table (manual blocks)
CREATE TABLE IF NOT EXISTS blocked_dates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  accommodation_id INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  reason TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (accommodation_id) REFERENCES accommodations(id)
);

-- Sessions table (for admin auth)
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL
);

-- Team users table (for teams portal)
CREATE TABLE IF NOT EXISTS team_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  allowed_accommodations TEXT DEFAULT '[]',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Team sessions table (separate from admin sessions)
CREATE TABLE IF NOT EXISTS team_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  team_user_id INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (team_user_id) REFERENCES team_users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_accommodation ON bookings(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_accommodation ON blocked_dates(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_team_sessions_token ON team_sessions(token);
