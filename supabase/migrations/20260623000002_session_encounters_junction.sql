-- Replace encounters.session_id (single FK) with a proper junction table
-- so one encounter can appear in multiple sessions.

CREATE TABLE session_encounters (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id  uuid NOT NULL REFERENCES sessions(id)  ON DELETE CASCADE,
  encounter_id uuid NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(session_id, encounter_id)
);

-- Migrate existing single-session links
INSERT INTO session_encounters (session_id, encounter_id)
SELECT session_id, id FROM encounters WHERE session_id IS NOT NULL;

ALTER TABLE encounters DROP COLUMN session_id;
