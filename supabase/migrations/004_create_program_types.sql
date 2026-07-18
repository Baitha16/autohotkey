CREATE TABLE IF NOT EXISTS program_types (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL DEFAULT '#8b5cf6',
  latest_version TEXT DEFAULT '1.0.0',
  discord_link TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO program_types (name, color, latest_version, discord_link)
SELECT 'Piano', '#8b5cf6', '1.0.0', 'https://discord.gg/tVj2sHwG3Z'
WHERE NOT EXISTS (SELECT 1 FROM program_types WHERE name = 'Piano');

INSERT INTO program_types (name, color, latest_version, discord_link)
SELECT 'Point Blank', '#10b981', '1.0.0', 'https://discord.gg/nMD4KgQnVc'
WHERE NOT EXISTS (SELECT 1 FROM program_types WHERE name = 'Point Blank');
