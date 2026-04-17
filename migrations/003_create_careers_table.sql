-- 003_create_careers_table.sql
-- Creates careers table for career management module.

CREATE TABLE IF NOT EXISTS careers (
  id TEXT PRIMARY KEY,
  job_title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  employment_type TEXT NOT NULL,
  status TEXT NOT NULL,
  experience TEXT NOT NULL,
  full_description TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_careers_status ON careers(status);
CREATE INDEX IF NOT EXISTS idx_careers_location ON careers(location);
CREATE INDEX IF NOT EXISTS idx_careers_department ON careers(department);
