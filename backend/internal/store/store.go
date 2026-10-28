package store

import (
	"context"
	"errors"

	"github.com/VALENTINE-it/Rider/backend/internal/models"
)

var (
	ErrNotFound            = errors.New("record not found")
	ErrConflict            = errors.New("record conflict")
	ErrDuplicatePhone      = errors.New("phone number already registered")
	ErrInvalidCredentials  = errors.New("invalid credentials")
	ErrSessionExpired      = errors.New("session expired or revoked")
	ErrTripAlreadyAssigned = errors.New("trip already assigned to another rider")
	ErrOfferExpired        = errors.New("trip offer has expired")
	ErrInvalidState        = errors.New("invalid state transition")
)

// Store defines all persistence operations required across the platform.
type Store interface {
	// User & Credentials
	CreateUser(ctx context.Context, u *models.User, passwordHash string) error
	GetUserByID(ctx context.Context, id string) (*models.User, error)
	GetUserByPhone(ctx context.Context, phone string) (*models.User, error)
	GetPasswordHash(ctx context.Context, userID string) (string, error)
	UpdateUserStatus(ctx context.Context, userID, status string) error
	ListUsers(ctx context.Context, role, status string) ([]*models.User, error)

	// Sessions
	CreateSession(ctx context.Context, s *models.Session) error
	GetSessionByTokenHash(ctx context.Context, tokenHash string) (*models.Session, error)
	RevokeSession(ctx context.Context, sessionID string) error
	RevokeAllUserSessions(ctx context.Context, userID string) error

	// Profiles & Motorbikes
	CreatePassengerProfile(ctx context.Context, p *models.PassengerProfile) error
	GetPassengerProfile(ctx context.Context, userID string) (*models.PassengerProfile, error)
	UpdatePassengerProfile(ctx context.Context, p *models.PassengerProfile) error

	CreateRiderProfile(ctx context.Context, r *models.RiderProfile) error
	GetRiderProfile(ctx context.Context, userID string) (*models.RiderProfile, error)
	UpdateRiderProfile(ctx context.Context, r *models.RiderProfile) error
	ListRiders(ctx context.Context, verificationStatus string) ([]*models.RiderProfile, error)

	CreateMotorbike(ctx context.Context, m *models.Motorbike) error
	GetMotorbikeByRiderID(ctx context.Context, riderID string) (*models.Motorbike, error)
	UpdateMotorbike(ctx context.Context, m *models.Motorbike) error

	// Verification
	AddVerificationDocument(ctx context.Context, d *models.VerificationDocument) error
	GetVerificationDocuments(ctx context.Context, riderID string) ([]*models.VerificationDocument, error)
	AddVerificationReview(ctx context.Context, rev *models.VerificationReview) error
	GetVerificationReviews(ctx context.Context, riderID string) ([]*models.VerificationReview, error)

	// Location & Presence
	UpdateRiderLocation(ctx context.Context, loc *models.RiderLocation) error
	GetRiderLocation(ctx context.Context, riderID string) (*models.RiderLocation, error)
	SetRiderPresence(ctx context.Context, riderID string, isOnline bool) error
	GetRiderPresence(ctx context.Context, riderID string) (*models.RiderPresence, error)
	FindNearbyEligibleRiders(ctx context.Context, lat, lng float64, radiusKm float64, limit int) ([]*models.RiderProfile, error)

	// Pricing & Quotes
	GetActivePricingRule(ctx context.Context) (*models.PricingRule, error)
	CreatePricingRule(ctx context.Context, pr *models.PricingRule) error
	ListPricingRules(ctx context.Context) ([]*models.PricingRule, error)
	CreateFareQuote(ctx context.Context, q *models.FareQuote) error
	GetFareQuote(ctx context.Context, quoteID string) (*models.FareQuote, error)

	// Trips & Offers
	CreateTrip(ctx context.Context, t *models.Trip) error
	GetTripByID(ctx context.Context, tripID string) (*models.Trip, error)
	UpdateTripStatus(ctx context.Context, tripID, status, actorID string, meta map[string]any) error
	AssignTripToRider(ctx context.Context, tripID, riderID string) error
	ListTrips(ctx context.Context, passengerID, riderID, status string) ([]*models.Trip, error)
	GetActiveTripForUser(ctx context.Context, userID, role string) (*models.Trip, error)

	CreateTripOffer(ctx context.Context, o *models.TripOffer) error
	GetTripOfferByID(ctx context.Context, offerID string) (*models.TripOffer, error)
	GetActiveOfferForRider(ctx context.Context, riderID string) (*models.TripOffer, error)
	UpdateOfferStatus(ctx context.Context, offerID, status string) error
	ListTripEvents(ctx context.Context, tripID string) ([]*models.TripEvent, error)
	RecordTripEvent(ctx context.Context, ev *models.TripEvent) error

	// Subscriptions
	CreateSubscriptionPlan(ctx context.Context, plan *models.SubscriptionPlan) error
	GetSubscriptionPlanByID(ctx context.Context, planID string) (*models.SubscriptionPlan, error)
	ListSubscriptionPlans(ctx context.Context, activeOnly bool) ([]*models.SubscriptionPlan, error)
	GetRiderSubscription(ctx context.Context, riderID string) (*models.RiderSubscription, error)
	UpsertRiderSubscription(ctx context.Context, sub *models.RiderSubscription) error
	ListRiderSubscriptions(ctx context.Context) ([]*models.RiderSubscription, error)

	// Safety
	CreateSafetyReport(ctx context.Context, rep *models.SafetyReport) error
	GetSafetyReportByID(ctx context.Context, reportID string) (*models.SafetyReport, error)
	UpdateSafetyReportStatus(ctx context.Context, reportID, status, notes string) error
	ListSafetyReports(ctx context.Context, status string) ([]*models.SafetyReport, error)

	// Audit Logs
	RecordAuditLog(ctx context.Context, log *models.AuditLog) error
	ListAuditLogs(ctx context.Context, limit int) ([]*models.AuditLog, error)

	// Platform Operational Metrics (Real queries)
	GetAdminMetrics(ctx context.Context) (map[string]any, error)
}
