-- 002_seed_feature_flags.sql

INSERT INTO feature_flags (flag_key, is_enabled) VALUES ('adminPanel', 1)
  ON CONFLICT(flag_key) DO UPDATE SET is_enabled = excluded.is_enabled, updated_at = datetime('now');
INSERT INTO feature_flags (flag_key, is_enabled) VALUES ('portfolioManagement', 1)
  ON CONFLICT(flag_key) DO UPDATE SET is_enabled = excluded.is_enabled, updated_at = datetime('now');
INSERT INTO feature_flags (flag_key, is_enabled) VALUES ('servicesManagement', 1)
  ON CONFLICT(flag_key) DO UPDATE SET is_enabled = excluded.is_enabled, updated_at = datetime('now');
INSERT INTO feature_flags (flag_key, is_enabled) VALUES ('teamManagement', 1)
  ON CONFLICT(flag_key) DO UPDATE SET is_enabled = excluded.is_enabled, updated_at = datetime('now');
INSERT INTO feature_flags (flag_key, is_enabled) VALUES ('testimonialManagement', 1)
  ON CONFLICT(flag_key) DO UPDATE SET is_enabled = excluded.is_enabled, updated_at = datetime('now');
INSERT INTO feature_flags (flag_key, is_enabled) VALUES ('blogManagement', 1)
  ON CONFLICT(flag_key) DO UPDATE SET is_enabled = excluded.is_enabled, updated_at = datetime('now');
