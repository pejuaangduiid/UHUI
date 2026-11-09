-- +goose Up
ALTER TABLE community_threads
  ADD COLUMN group_id UUID REFERENCES community_groups(id) ON DELETE SET NULL;

CREATE INDEX idx_threads_group ON community_threads(group_id);

-- +goose Down
DROP INDEX IF EXISTS idx_threads_group;
ALTER TABLE community_threads
  DROP COLUMN IF EXISTS group_id;

