-- name: CreateUser :one
INSERT INTO users (email, password_hash, full_name, role, pdp_consent_at)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetUserByEmail :one
SELECT *
FROM users
WHERE email = $1 AND deleted_at IS NULL;

-- name: GetUserByID :one
SELECT *
FROM users
WHERE id = $1 AND deleted_at IS NULL;

-- name: SetUserRole :exec
UPDATE users
SET role = $2, updated_at = NOW()
WHERE id = $1 AND deleted_at IS NULL;

-- name: SoftDeleteUser :exec
UPDATE users
SET deleted_at = NOW(), email = $2, full_name = 'Anonim'
WHERE id = $1;

-- name: CreateRefreshToken :one
INSERT INTO refresh_tokens (user_id, family_id, token_hash, expires_at)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetRefreshTokenByHash :one
SELECT *
FROM refresh_tokens
WHERE token_hash = $1;

-- name: RevokeTokenFamily :exec
UPDATE refresh_tokens
SET revoked_at = NOW()
WHERE family_id = $1 AND revoked_at IS NULL;

-- name: RevokeToken :exec
UPDATE refresh_tokens
SET revoked_at = NOW()
WHERE id = $1;
