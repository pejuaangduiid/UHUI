package bursa

import (
	"github.com/uhui/backend/internal/db/gen"
)

func CanTransition(from, to gen.CampaignStatus, actorRole string) bool {
	switch from {
	case gen.CampaignStatusDraft:
		return transitionFromDraft(to, actorRole)
	case gen.CampaignStatusInReview:
		return transitionFromInReview(to, actorRole)
	case gen.CampaignStatusOpen:
		return transitionFromOpen(to, actorRole)
	case gen.CampaignStatusFunded:
		return transitionFromFunded(to, actorRole)
	case gen.CampaignStatusClosed, gen.CampaignStatusCancelled:
		return false
	default:
		return false
	}
}

func transitionFromDraft(to gen.CampaignStatus, actorRole string) bool {
	if actorRole == string(gen.UserRoleSmeOwner) {
		return to == gen.CampaignStatusInReview || to == gen.CampaignStatusCancelled
	}
	return false
}

func transitionFromInReview(to gen.CampaignStatus, actorRole string) bool {
	if actorRole == string(gen.UserRoleAdmin) {
		return to == gen.CampaignStatusOpen || to == gen.CampaignStatusCancelled
	}
	if actorRole == string(gen.UserRoleSmeOwner) {
		return to == gen.CampaignStatusCancelled
	}
	return false
}

func transitionFromOpen(to gen.CampaignStatus, actorRole string) bool {
	if to == gen.CampaignStatusFunded || to == gen.CampaignStatusClosed {
		return true
	}
	if actorRole == string(gen.UserRoleAdmin) || actorRole == string(gen.UserRoleSmeOwner) {
		return to == gen.CampaignStatusCancelled
	}
	return false
}

func transitionFromFunded(to gen.CampaignStatus, actorRole string) bool {
	if actorRole == string(gen.UserRoleAdmin) {
		return to == gen.CampaignStatusClosed
	}
	return false
}
