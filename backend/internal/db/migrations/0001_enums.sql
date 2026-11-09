-- +goose Up
CREATE TYPE user_role AS ENUM ('sme_owner', 'investor', 'mentor', 'admin');
CREATE TYPE ai_schedule_interval AS ENUM ('14_days', '28_days', 'disabled');
CREATE TYPE funding_scheme AS ENUM ('revenue_sharing', 'micro_equity');
CREATE TYPE campaign_status AS ENUM ('draft', 'in_review', 'open', 'funded', 'closed', 'cancelled');
CREATE TYPE investment_status AS ENUM ('pending', 'confirmed', 'refunded');
CREATE TYPE review_status AS ENUM ('pending', 'verified', 'rejected');

-- +goose Down
DROP TYPE IF EXISTS review_status;
DROP TYPE IF EXISTS investment_status;
DROP TYPE IF EXISTS campaign_status;
DROP TYPE IF EXISTS funding_scheme;
DROP TYPE IF EXISTS ai_schedule_interval;
DROP TYPE IF EXISTS user_role;

