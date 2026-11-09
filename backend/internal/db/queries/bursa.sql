-- name: CreateCampaign :one
INSERT INTO bursa_campaigns (
  sme_id, slug, title, scheme, target_amount_idr,
  min_investment_idr, return_share_bps, term_months, closes_at
) VALUES (
  $1, $2, $3, $4, $5,
  $6, $7, $8, $9
) RETURNING *;

-- name: GetCampaignByID :one
SELECT * FROM bursa_campaigns
WHERE id = $1;

-- name: GetCampaignByIDForUpdate :one
SELECT * FROM bursa_campaigns
WHERE id = $1
FOR UPDATE;

-- name: GetCampaignBySlug :one
SELECT c.*, s.business_name, s.sector, s.description as sme_description, s.is_incorporated_pt, s.digital_readiness_score as latest_readiness_score
FROM bursa_campaigns c
JOIN smes s ON c.sme_id = s.id
WHERE c.slug = $1;

-- name: ListCampaignsBySME :many
SELECT * FROM bursa_campaigns
WHERE sme_id = $1
ORDER BY created_at DESC;

-- name: ListOpenCampaigns :many
SELECT c.*, s.business_name, s.sector, s.slug as sme_slug, s.digital_readiness_score as latest_readiness_score, s.is_incorporated_pt
FROM bursa_campaigns c
JOIN smes s ON c.sme_id = s.id
WHERE c.status = 'open'
  AND ($1::text = '' OR c.scheme::text = $1)
  AND ($2::text = '' OR s.sector = $2)
ORDER BY c.created_at DESC
LIMIT $3;

-- name: CheckActiveCampaignExists :one
SELECT EXISTS (
  SELECT 1 FROM bursa_campaigns
  WHERE sme_id = $1 AND status IN ('in_review', 'open') AND id <> $2
) as exists;

-- name: SubmitCampaignForReview :one
UPDATE bursa_campaigns
SET status = 'in_review', readiness_score_id = $2
WHERE id = $1 AND status = 'draft'
RETURNING *;

-- name: UpdateCampaignStatus :one
UPDATE bursa_campaigns
SET status = $2, review_note = $3, reviewed_by = $4, funded_at = $5
WHERE id = $1
RETURNING *;

-- name: AddCampaignRaisedAmount :one
UPDATE bursa_campaigns
SET raised_amount_idr = raised_amount_idr + $2,
    status = CASE WHEN raised_amount_idr + $2 >= target_amount_idr THEN 'funded'::campaign_status ELSE status END,
    funded_at = CASE WHEN raised_amount_idr + $2 >= target_amount_idr AND funded_at IS NULL THEN NOW() ELSE funded_at END
WHERE id = $1
RETURNING *;

-- name: FindInvestmentByIdempotencyKey :one
SELECT * FROM investments
WHERE investor_id = $1 AND idempotency_key = $2;

-- name: CreateInvestment :one
INSERT INTO investments (
  campaign_id, investor_id, amount_idr, status, idempotency_key, request_hash, payment_ref
) VALUES (
  $1, $2, $3, $4, $5, $6, $7
) RETURNING *;

-- name: UpdateInvestmentStatus :one
UPDATE investments
SET status = $2, payment_ref = $3
WHERE id = $1
RETURNING *;

-- name: ListConfirmedInvestmentsByCampaign :many
SELECT * FROM investments
WHERE campaign_id = $1 AND status = 'confirmed'
ORDER BY amount_idr DESC, created_at ASC;

-- name: ListInvestorPortfolio :many
SELECT i.id, i.campaign_id, i.amount_idr, i.status, i.payment_ref, i.created_at,
       c.title as campaign_title, c.slug as campaign_slug, c.status as campaign_status,
       c.scheme, c.return_share_bps, c.term_months,
       s.id as sme_id, s.business_name, s.sector
FROM investments i
JOIN bursa_campaigns c ON i.campaign_id = c.id
JOIN smes s ON c.sme_id = s.id
WHERE i.investor_id = $1
ORDER BY i.created_at DESC;

-- name: HasConfirmedInvestmentOnSME :one
SELECT EXISTS (
  SELECT 1 FROM investments i
  JOIN bursa_campaigns c ON i.campaign_id = c.id
  WHERE i.investor_id = $1 AND c.sme_id = $2 AND i.status = 'confirmed'
) as has_investment;

-- name: ListExpiredOpenCampaigns :many
SELECT * FROM bursa_campaigns
WHERE status = 'open' AND closes_at <= NOW() AND raised_amount_idr < target_amount_idr
ORDER BY closes_at ASC
LIMIT 50;

-- name: RefundCampaignInvestments :exec
UPDATE investments
SET status = 'refunded'
WHERE campaign_id = $1 AND status = 'confirmed';

-- name: CreateProfitDistribution :one
INSERT INTO profit_distributions (
  campaign_id, report_snapshot_id, period_start, period_end, pool_idr
) VALUES (
  $1, $2, $3, $4, $5
) RETURNING *;

-- name: CreateDistributionItem :one
INSERT INTO distribution_items (
  distribution_id, investment_id, amount_idr
) VALUES (
  $1, $2, $3
) RETURNING *;

-- name: ListProfitDistributionsByCampaign :many
SELECT * FROM profit_distributions
WHERE campaign_id = $1
ORDER BY period_end DESC;

-- name: ListDistributionItemsByDistributionID :many
SELECT di.*, i.investor_id, u.full_name as investor_name
FROM distribution_items di
JOIN investments i ON di.investment_id = i.id
JOIN users u ON i.investor_id = u.id
WHERE di.distribution_id = $1
ORDER BY di.amount_idr DESC;

-- name: ListInReviewCampaigns :many
SELECT c.*, s.business_name, s.sector, s.slug as sme_slug, u.email as owner_email, u.full_name as owner_name
FROM bursa_campaigns c
JOIN smes s ON c.sme_id = s.id
JOIN users u ON s.owner_id = u.id
WHERE c.status = 'in_review'
ORDER BY c.created_at ASC;

