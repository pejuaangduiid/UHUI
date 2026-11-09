-- +goose Up
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

ALTER TABLE smes ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE smes ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

ALTER TABLE bursa_campaigns ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE bursa_campaigns ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

ALTER TABLE community_threads ADD COLUMN IF NOT EXISTS is_deleted_by_admin BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE community_threads ADD COLUMN IF NOT EXISTS admin_delete_reason TEXT;

ALTER TABLE community_comments ADD COLUMN IF NOT EXISTS is_deleted_by_admin BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE community_comments ADD COLUMN IF NOT EXISTS admin_delete_reason TEXT;

-- +goose Down
ALTER TABLE community_comments DROP COLUMN IF EXISTS admin_delete_reason;
ALTER TABLE community_comments DROP COLUMN IF EXISTS is_deleted_by_admin;

ALTER TABLE community_threads DROP COLUMN IF EXISTS admin_delete_reason;
ALTER TABLE community_threads DROP COLUMN IF EXISTS is_deleted_by_admin;

ALTER TABLE bursa_campaigns DROP COLUMN IF EXISTS suspension_reason;
ALTER TABLE bursa_campaigns DROP COLUMN IF EXISTS is_suspended;

ALTER TABLE smes DROP COLUMN IF EXISTS suspension_reason;
ALTER TABLE smes DROP COLUMN IF EXISTS is_suspended;

ALTER TABLE users DROP COLUMN IF EXISTS suspension_reason;
ALTER TABLE users DROP COLUMN IF EXISTS suspended_until;

