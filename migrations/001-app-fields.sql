BEGIN;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS notes text NOT NULL DEFAULT '';
ALTER TABLE participants ADD COLUMN IF NOT EXISTS submitted boolean NOT NULL DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '#2563eb';
ALTER TABLE events ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS synctime_participants_group ON participants(group_id);
CREATE INDEX IF NOT EXISTS synctime_events_group ON events(group_id);
CREATE INDEX IF NOT EXISTS synctime_availability_participant ON availability(participant_id);
COMMIT;
