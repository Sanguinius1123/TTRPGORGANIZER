ALTER TABLE items
  ADD COLUMN IF NOT EXISTS category   text,
  ADD COLUMN IF NOT EXISTS descriptor text,
  ADD COLUMN IF NOT EXISTS properties jsonb NOT NULL DEFAULT '{}'::jsonb;
