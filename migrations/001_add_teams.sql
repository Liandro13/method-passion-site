-- Migration: Add team users and team sessions tables
-- Run with: npx wrangler d1 execute method-passion-db --remote --file=./migrations/001_add_teams.sql

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

-- Add index for bookings status (for faster pending queries)
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Add index for team sessions
CREATE INDEX IF NOT EXISTS idx_team_sessions_token ON team_sessions(token);
