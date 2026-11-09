-- +goose Up
CREATE TABLE community_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sme_id UUID REFERENCES smes(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  visibility VARCHAR(20) NOT NULL CHECK (visibility IN ('public_hub','private_boardroom')),
  kind VARCHAR(20) NOT NULL DEFAULT 'discussion' CHECK (kind IN ('discussion','bounty')),
  title VARCHAR(250) NOT NULL,
  content TEXT NOT NULL,
  shared_metrics_json JSONB,
  attached_ai_report_id UUID REFERENCES ai_diagnostic_reports(id) ON DELETE SET NULL,
  upvotes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((visibility = 'public_hub' AND sme_id IS NULL) OR (visibility = 'private_boardroom' AND sme_id IS NOT NULL)),
  CHECK (attached_ai_report_id IS NULL OR visibility = 'private_boardroom'),
  CHECK (shared_metrics_json IS NULL OR visibility = 'public_hub')
);

CREATE TABLE community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES community_threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE community_votes (
  thread_id UUID NOT NULL REFERENCES community_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (thread_id, user_id)
);

-- +goose Down
DROP TABLE IF EXISTS community_votes;
DROP TABLE IF EXISTS community_comments;
DROP TABLE IF EXISTS community_threads;

