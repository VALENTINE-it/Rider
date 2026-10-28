package models

import (
	"time"
)

// User Roles
const (
	RolePassenger  = "passenger"
	RoleRider      = "rider"
	RoleAdmin      = "admin"
	RoleSuperAdmin = "super_admin"
)

// User Status
const (
	UserStatusActive    = "active"
	UserStatusSuspended = "suspended"
	UserStatusClosed    = "closed"
)

// Rider Verification Status
const (
	VerificationPending     = "pending"
	VerificationUnderReview = "under_review"
	VerificationApproved    = "approved"
	VerificationRejected    = "rejected"
)

// Trip Lifecycle States (docs/ARCHITECTURE.md, docs/API.md)
const (
	TripStatusRequested       = "requested"
	TripStatusSearching       = "searching"
	TripStatusAssigned        = "assigned"
	TripStatusRiderArriving   = "arriving"
	TripStatusRiderArrived    = "arrived"
	TripStatusInProgress      = "in_progress"
	TripStatusCompleted       = "completed"
	TripStatusCancelled       = "cancelled"
	TripStatusNoRiderAvail    = "unavailable"
)

// Trip Offer Status
const (
	OfferStatusDispatched = "dispatched"
	OfferStatusAccepted   = "accepted"
	OfferStatusRejected   = "rejected"
	OfferStatusExpired    = "expired"
)

// Payment Statuses (Cash & Digital)
const (
	PaymentStatusPending      = "pending"
	PaymentStatusReportedPaid = "reported_paid"
	PaymentStatusConfirmed    = "confirmed"
	PaymentStatusDisputed     = "disputed"
)

// Subscription Status
const (
	SubStatusTrial     = "trial"
	SubStatusActive    = "active"
	SubStatusExpired   = "expired"
	SubStatusSuspended = "suspended"
	SubStatusCancelled = "cancelled"
)

// Safety Report Category
const (
	SafetyEmergency       = "emergency_sos"
	SafetyHelmetMissing   = "helmet_missing"
	SafetyRecklessDriving = "reckless_driving"
	SafetyHarassment      = "harassment"
	SafetyFareDispute     = "fare_dispute"
	SafetyOther           = "other"
)

// User represents an identity in the system.
type User struct {
	ID              string     `json:"id"`
	PhoneE164       string     `json:"phone_e164"`
	PhoneVerifiedAt *time.Time `json:"phone_verified_at,omitempty"`
	Status          string     `json:"status"`
	Roles           []string   `json:"roles"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

// Session represents an authenticated web session.
type Session struct {
	ID         string     `json:"id"`
	UserID     string     `json:"user_id"`
	TokenHash  string     `json:"-"`
	ExpiresAt  time.Time  `json:"expires_at"`
	RevokedAt  *time.Time `json:"revoked_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
	LastSeenAt time.Time  `json:"last_seen_at"`
}

// PassengerProfile stores passenger-specific details.
type PassengerProfile struct {
	UserID      string    `json:"user_id"`
	DisplayName string    `json:"display_name"`
	CreatedAt   time.Time `json:"created_at"`
}

// RiderProfile stores rider-specific details.
type RiderProfile struct {
	UserID             string    `json:"user_id"`
	DisplayName        string    `json:"display_name"`
	VerificationStatus string    `json:"verification_status"`
	AccountStatus      string    `json:"account_status"`
	Rating             float64   `json:"rating"`
	CompletedTrips     int       `json:"completed_trips"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

// Motorbike represents a registered motorcycle.
type Motorbike struct {
	ID             string    `json:"id"`
	RiderID        string    `json:"rider_id"`
	PlateNumber    string    `json:"plate_number"`
	Model          string    `json:"model"`
	HelmetIncluded bool      `json:"helmet_included"`
	Status         string    `json:"status"`
	CreatedAt      time.Time `json:"created_at"`
}

// VerificationDocument holds metadata about uploaded vetting docs.
type VerificationDocument struct {
	ID        string    `json:"id"`
	RiderID   string    `json:"rider_id"`
	DocType   string    `json:"doc_type"`
	FileURL   string    `json:"file_url"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

// VerificationReview represents an administrative review action.
type VerificationReview struct {
	ID         string    `json:"id"`
	RiderID    string    `json:"rider_id"`
	ReviewerID string    `json:"reviewer_id"`
	Decision   string    `json:"decision"`
	Notes      string    `json:"notes"`
	CreatedAt  time.Time `json:"created_at"`
}

// Coordinates represents latitude and longitude.
type Coordinates struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

// RiderLocation holds the latest geographic position of a rider.
type RiderLocation struct {
	RiderID    string      `json:"rider_id"`
	Location   Coordinates `json:"location"`
	Heading    float64     `json:"heading"`
	SpeedKmh   float64     `json:"speed_kmh"`
	RecordedAt time.Time   `json:"recorded_at"`
}

// RiderPresence tracks online/offline state and heartbeat.
type RiderPresence struct {
	RiderID         string    `json:"rider_id"`
	IsOnline        bool      `json:"is_online"`
	LastHeartbeatAt time.Time `json:"last_heartbeat_at"`
}

// PricingRule stores authoritative fare parameters.
// All monetary values in integer minor units (KES cents).
type PricingRule struct {
	ID            string    `json:"id"`
	Currency      string    `json:"currency"`
	BaseFareMinor int64     `json:"base_fare_minor"`
	PerKmMinor    int64     `json:"per_km_minor"`
	PerMinMinor   int64     `json:"per_min_minor"`
	MinFareMinor  int64     `json:"min_fare_minor"`
	Version       int       `json:"version"`
	Active        bool      `json:"active"`
	CreatedAt     time.Time `json:"created_at"`
}

// FareQuote represents an upfront server-calculated trip estimate.
type FareQuote struct {
	ID              string      `json:"id"`
	PassengerID     string      `json:"passenger_id"`
	Pickup          Coordinates `json:"pickup"`
	Destination     Coordinates `json:"destination"`
	PickupAddress   string      `json:"pickup_address"`
	DestAddress     string      `json:"dest_address"`
	DistanceMeters  int         `json:"distance_meters"`
	DurationSeconds int         `json:"duration_seconds"`
	Currency        string      `json:"currency"`
	FareMinor       int64       `json:"fare_minor"`
	PricingVersion  int         `json:"pricing_version"`
	ExpiresAt       time.Time   `json:"expires_at"`
	CreatedAt       time.Time   `json:"created_at"`
}

// Trip represents a motorbike ride.
type Trip struct {
	ID            string    `json:"id"`
	PassengerID   string    `json:"passenger_id"`
	RiderID       *string   `json:"rider_id,omitempty"`
	FareQuoteID   string    `json:"fare_quote_id"`
	Status        string    `json:"status"`
	PickupAddress string    `json:"pickup_address"`
	DestAddress   string    `json:"dest_address"`
	PickupLat     float64   `json:"pickup_lat"`
	PickupLng     float64   `json:"pickup_lng"`
	DestLat       float64   `json:"dest_lat"`
	DestLng       float64   `json:"dest_lng"`
	FareMinor     int64     `json:"fare_minor"`
	Currency      string    `json:"currency"`
	PaymentStatus string    `json:"payment_status"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`

	// Enriched fields for API responses
	PassengerName *string    `json:"passenger_name,omitempty"`
	PassengerPhone *string   `json:"passenger_phone,omitempty"`
	RiderName     *string    `json:"rider_name,omitempty"`
	RiderPhone    *string    `json:"rider_phone,omitempty"`
	RiderRating   *float64   `json:"rider_rating,omitempty"`
	Motorbike     *Motorbike `json:"motorbike,omitempty"`
}

// TripOffer represents an offer dispatched to an eligible rider.
type TripOffer struct {
	ID        string    `json:"id"`
	TripID    string    `json:"trip_id"`
	RiderID   string    `json:"rider_id"`
	Status    string    `json:"status"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`

	// Offer view details
	Trip *Trip `json:"trip,omitempty"`
}

// TripEvent logs every state transition for auditing.
type TripEvent struct {
	ID         string         `json:"id"`
	TripID     string         `json:"trip_id"`
	ActorID    string         `json:"actor_id"`
	FromStatus string         `json:"from_status,omitempty"`
	ToStatus   string         `json:"to_status"`
	Metadata   map[string]any `json:"metadata"`
	CreatedAt  time.Time      `json:"created_at"`
}

// SubscriptionPlan represents a subscription package (0% commission platform).
type SubscriptionPlan struct {
	ID         string    `json:"id"`
	Code       string    `json:"code"`
	Name       string    `json:"name"`
	PriceMinor int64     `json:"price_minor"`
	Currency   string    `json:"currency"`
	PeriodDays int       `json:"period_days"`
	TrialDays  int       `json:"trial_days"`
	Active     bool      `json:"active"`
	CreatedAt  time.Time `json:"created_at"`
}

// RiderSubscription represents an operator's active subscription or trial.
type RiderSubscription struct {
	ID        string    `json:"id"`
	RiderID   string    `json:"rider_id"`
	PlanID    string    `json:"plan_id"`
	Status    string    `json:"status"`
	StartsAt  time.Time `json:"starts_at"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`

	// Enriched plan details
	Plan *SubscriptionPlan `json:"plan,omitempty"`
}

// SafetyReport represents an incident or SOS report.
type SafetyReport struct {
	ID          string    `json:"id"`
	TripID      *string   `json:"trip_id,omitempty"`
	ReporterID  string    `json:"reporter_id"`
	Category    string    `json:"category"`
	Description string    `json:"description"`
	Status      string    `json:"status"` // open, investigating, resolved, dismissed
	Notes       string    `json:"notes,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// AuditLog records security-critical or administrative mutations.
type AuditLog struct {
	ID         string         `json:"id"`
	ActorID    string         `json:"actor_id"`
	Action     string         `json:"action"`
	TargetType string         `json:"target_type"`
	TargetID   string         `json:"target_id"`
	Details    map[string]any `json:"details"`
	IPAddress  string         `json:"ip_address,omitempty"`
	CreatedAt  time.Time      `json:"created_at"`
}
