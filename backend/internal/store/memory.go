package store

import (
	"context"
	"fmt"
	"math"
	"sort"
	"sync"
	"time"

	"github.com/VALENTINE-it/Rider/backend/internal/models"
	"golang.org/x/crypto/bcrypt"
)

// MemoryStore provides a thread-safe, in-memory implementation of Store.
type MemoryStore struct {
	mu sync.RWMutex

	users         map[string]*models.User
	userPhones    map[string]string // phone -> userID
	credentials   map[string]string // userID -> passwordHash
	sessions      map[string]*models.Session
	sessionTokens map[string]string // tokenHash -> sessionID

	passengerProfiles map[string]*models.PassengerProfile // userID -> profile
	riderProfiles     map[string]*models.RiderProfile     // userID -> profile
	motorbikes        map[string]*models.Motorbike        // riderID -> motorbike

	verificationDocs    map[string][]*models.VerificationDocument // riderID -> docs
	verificationReviews map[string][]*models.VerificationReview   // riderID -> reviews

	riderLocations map[string]*models.RiderLocation // riderID -> location
	riderPresence  map[string]*models.RiderPresence // riderID -> presence

	pricingRules map[string]*models.PricingRule
	fareQuotes   map[string]*models.FareQuote

	trips      map[string]*models.Trip
	tripOffers map[string]*models.TripOffer
	tripEvents map[string][]*models.TripEvent // tripID -> events

	subscriptionPlans  map[string]*models.SubscriptionPlan
	riderSubscriptions map[string]*models.RiderSubscription // riderID -> sub

	safetyReports map[string]*models.SafetyReport
	auditLogs     []*models.AuditLog
}

func NewMemoryStore() *MemoryStore {
	ms := &MemoryStore{
		users:               make(map[string]*models.User),
		userPhones:          make(map[string]string),
		credentials:         make(map[string]string),
		sessions:            make(map[string]*models.Session),
		sessionTokens:       make(map[string]string),
		passengerProfiles:   make(map[string]*models.PassengerProfile),
		riderProfiles:       make(map[string]*models.RiderProfile),
		motorbikes:          make(map[string]*models.Motorbike),
		verificationDocs:    make(map[string][]*models.VerificationDocument),
		verificationReviews: make(map[string][]*models.VerificationReview),
		riderLocations:      make(map[string]*models.RiderLocation),
		riderPresence:       make(map[string]*models.RiderPresence),
		pricingRules:        make(map[string]*models.PricingRule),
		fareQuotes:          make(map[string]*models.FareQuote),
		trips:               make(map[string]*models.Trip),
		tripOffers:          make(map[string]*models.TripOffer),
		tripEvents:          make(map[string][]*models.TripEvent),
		subscriptionPlans:   make(map[string]*models.SubscriptionPlan),
		riderSubscriptions:  make(map[string]*models.RiderSubscription),
		safetyReports:       make(map[string]*models.SafetyReport),
		auditLogs:           make([]*models.AuditLog, 0),
	}

	ms.seedDefaultData()
	return ms
}

func (ms *MemoryStore) seedDefaultData() {
	now := time.Now().UTC()

	// 1. Default Pricing Rule (Baseline: KSh 50 base, KSh 35/km, KSh 2/min, KSh 100 min fare)
	pr := &models.PricingRule{
		ID:            "pr_default_v1",
		Currency:      "KES",
		BaseFareMinor: 5000,
		PerKmMinor:    3500,
		PerMinMinor:   200,
		MinFareMinor:  10000,
		Version:       1,
		Active:        true,
		CreatedAt:     now,
	}
	ms.pricingRules[pr.ID] = pr

	// 2. Subscription Plans (0% Commission Model)
	trialPlan := &models.SubscriptionPlan{
		ID:         "plan_pilot_trial",
		Code:       "PILOT_30D_FREE",
		Name:       "Nairobi Pilot 30-Day Free Access",
		PriceMinor: 0,
		Currency:   "KES",
		PeriodDays: 30,
		TrialDays:  30,
		Active:     true,
		CreatedAt:  now,
	}
	monthlyPlan := &models.SubscriptionPlan{
		ID:         "plan_monthly",
		Code:       "MONTHLY_UNLIMITED",
		Name:       "Monthly Operator Pass",
		PriceMinor: 50000, // KSh 500.00
		Currency:   "KES",
		PeriodDays: 30,
		TrialDays:  0,
		Active:     true,
		CreatedAt:  now,
	}
	annualPlan := &models.SubscriptionPlan{
		ID:         "plan_annual",
		Code:       "ANNUAL_UNLIMITED",
		Name:       "Annual Operator Pass (Save 15%)",
		PriceMinor: 500000, // KSh 5,000.00
		Currency:   "KES",
		PeriodDays: 365,
		TrialDays:  0,
		Active:     true,
		CreatedAt:  now,
	}
	ms.subscriptionPlans[trialPlan.ID] = trialPlan
	ms.subscriptionPlans[monthlyPlan.ID] = monthlyPlan
	ms.subscriptionPlans[annualPlan.ID] = annualPlan

	// Password hash for seed accounts: "Pass1234!"
	hashedPwd, _ := bcrypt.GenerateFromPassword([]byte("Pass1234!"), bcrypt.DefaultCost)
	pwdStr := string(hashedPwd)

	// 3. Seed Passenger: Kevin Mwangi (+254712345678)
	pUser := &models.User{
		ID:              "usr_passenger_kevin",
		PhoneE164:       "+254712345678",
		PhoneVerifiedAt: &now,
		Status:          models.UserStatusActive,
		Roles:           []string{models.RolePassenger},
		CreatedAt:       now,
		UpdatedAt:       now,
	}
	ms.users[pUser.ID] = pUser
	ms.userPhones[pUser.PhoneE164] = pUser.ID
	ms.credentials[pUser.ID] = pwdStr
	ms.passengerProfiles[pUser.ID] = &models.PassengerProfile{
		UserID:      pUser.ID,
		DisplayName: "Kevin Mwangi",
		CreatedAt:   now,
	}

	// 4. Seed Rider: Juma Mwangi (+254722458912) - Verified & Online
	rUser := &models.User{
		ID:              "usr_rider_juma",
		PhoneE164:       "+254722458912",
		PhoneVerifiedAt: &now,
		Status:          models.UserStatusActive,
		Roles:           []string{models.RoleRider},
		CreatedAt:       now,
		UpdatedAt:       now,
	}
	ms.users[rUser.ID] = rUser
	ms.userPhones[rUser.PhoneE164] = rUser.ID
	ms.credentials[rUser.ID] = pwdStr
	ms.riderProfiles[rUser.ID] = &models.RiderProfile{
		UserID:             rUser.ID,
		DisplayName:        "Juma Mwangi",
		VerificationStatus: models.VerificationApproved,
		AccountStatus:      models.UserStatusActive,
		Rating:             4.95,
		CompletedTrips:     142,
		CreatedAt:          now,
		UpdatedAt:          now,
	}
	ms.motorbikes[rUser.ID] = &models.Motorbike{
		ID:             "mb_juma_01",
		RiderID:        rUser.ID,
		PlateNumber:    "KMD 821Q",
		Model:          "Bajaj Boxer 150",
		HelmetIncluded: true,
		Status:         models.VerificationApproved,
		CreatedAt:      now,
	}
	// Initial position: Westlands Commercial Area (-1.2673, 36.8111)
	ms.riderLocations[rUser.ID] = &models.RiderLocation{
		RiderID: rUser.ID,
		Location: models.Coordinates{
			Latitude:  -1.2673,
			Longitude: 36.8111,
		},
		Heading:    45.0,
		SpeedKmh:   0,
		RecordedAt: now,
	}
	ms.riderPresence[rUser.ID] = &models.RiderPresence{
		RiderID:         rUser.ID,
		IsOnline:        true,
		LastHeartbeatAt: now,
	}
	ms.riderSubscriptions[rUser.ID] = &models.RiderSubscription{
		ID:        "sub_juma_pilot",
		RiderID:   rUser.ID,
		PlanID:    trialPlan.ID,
		Status:    models.SubStatusTrial,
		StartsAt:  now,
		ExpiresAt: now.Add(24 * 24 * time.Hour),
		CreatedAt: now,
		Plan:      trialPlan,
	}

	// 5. Seed Pending Rider: Peter Ochieng (+254711998877)
	rPendingUser := &models.User{
		ID:              "usr_rider_peter",
		PhoneE164:       "+254711998877",
		PhoneVerifiedAt: &now,
		Status:          models.UserStatusActive,
		Roles:           []string{models.RoleRider},
		CreatedAt:       now,
		UpdatedAt:       now,
	}
	ms.users[rPendingUser.ID] = rPendingUser
	ms.userPhones[rPendingUser.PhoneE164] = rPendingUser.ID
	ms.credentials[rPendingUser.ID] = pwdStr
	ms.riderProfiles[rPendingUser.ID] = &models.RiderProfile{
		UserID:             rPendingUser.ID,
		DisplayName:        "Peter Ochieng",
		VerificationStatus: models.VerificationPending,
		AccountStatus:      models.UserStatusActive,
		Rating:             5.0,
		CompletedTrips:     0,
		CreatedAt:          now,
		UpdatedAt:          now,
	}
	ms.motorbikes[rPendingUser.ID] = &models.Motorbike{
		ID:             "mb_peter_01",
		RiderID:        rPendingUser.ID,
		PlateNumber:    "KMDK 392A",
		Model:          "TVS Star HLX 150",
		HelmetIncluded: true,
		Status:         models.VerificationPending,
		CreatedAt:      now,
	}
	ms.verificationDocs[rPendingUser.ID] = []*models.VerificationDocument{
		{ID: "doc_01", RiderID: rPendingUser.ID, DocType: "national_id", FileURL: "/uploads/docs/national_id_peter.jpg", Status: "verified", CreatedAt: now},
		{ID: "doc_02", RiderID: rPendingUser.ID, DocType: "driving_license", FileURL: "/uploads/docs/driving_license_peter.jpg", Status: "pending", CreatedAt: now},
		{ID: "doc_03", RiderID: rPendingUser.ID, DocType: "police_clearance", FileURL: "/uploads/docs/police_clearance_peter.pdf", Status: "pending", CreatedAt: now},
	}

	// 6. Seed Admin: Sarah Cherono (+254700000001)
	adminUser := &models.User{
		ID:              "usr_admin_sarah",
		PhoneE164:       "+254700000001",
		PhoneVerifiedAt: &now,
		Status:          models.UserStatusActive,
		Roles:           []string{models.RoleAdmin, models.RoleSuperAdmin},
		CreatedAt:       now,
		UpdatedAt:       now,
	}
	ms.users[adminUser.ID] = adminUser
	ms.userPhones[adminUser.PhoneE164] = adminUser.ID
	ms.credentials[adminUser.ID] = pwdStr
}

// -----------------------------------------------------------------------------
// User & Credentials
// -----------------------------------------------------------------------------

func (ms *MemoryStore) CreateUser(ctx context.Context, u *models.User, passwordHash string) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	if _, exists := ms.userPhones[u.PhoneE164]; exists {
		return ErrDuplicatePhone
	}

	ms.users[u.ID] = u
	ms.userPhones[u.PhoneE164] = u.ID
	ms.credentials[u.ID] = passwordHash
	return nil
}

func (ms *MemoryStore) GetUserByID(ctx context.Context, id string) (*models.User, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	u, exists := ms.users[id]
	if !exists {
		return nil, ErrNotFound
	}
	return u, nil
}

func (ms *MemoryStore) GetUserByPhone(ctx context.Context, phone string) (*models.User, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	userID, exists := ms.userPhones[phone]
	if !exists {
		return nil, ErrNotFound
	}
	return ms.users[userID], nil
}

func (ms *MemoryStore) GetPasswordHash(ctx context.Context, userID string) (string, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	hash, exists := ms.credentials[userID]
	if !exists {
		return "", ErrNotFound
	}
	return hash, nil
}

func (ms *MemoryStore) UpdateUserStatus(ctx context.Context, userID, status string) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	u, exists := ms.users[userID]
	if !exists {
		return ErrNotFound
	}
	u.Status = status
	u.UpdatedAt = time.Now().UTC()
	return nil
}

func (ms *MemoryStore) ListUsers(ctx context.Context, role, status string) ([]*models.User, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	res := make([]*models.User, 0)
	for _, u := range ms.users {
		if status != "" && u.Status != status {
			continue
		}
		if role != "" {
			hasRole := false
			for _, r := range u.Roles {
				if r == role {
					hasRole = true
					break
				}
			}
			if !hasRole {
				continue
			}
		}
		res = append(res, u)
	}
	return res, nil
}

// -----------------------------------------------------------------------------
// Sessions
// -----------------------------------------------------------------------------

func (ms *MemoryStore) CreateSession(ctx context.Context, s *models.Session) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	ms.sessions[s.ID] = s
	ms.sessionTokens[s.TokenHash] = s.ID
	return nil
}

func (ms *MemoryStore) GetSessionByTokenHash(ctx context.Context, tokenHash string) (*models.Session, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	sessionID, exists := ms.sessionTokens[tokenHash]
	if !exists {
		return nil, ErrNotFound
	}
	s, exists := ms.sessions[sessionID]
	if !exists || s.RevokedAt != nil || time.Now().UTC().After(s.ExpiresAt) {
		return nil, ErrSessionExpired
	}
	return s, nil
}

func (ms *MemoryStore) RevokeSession(ctx context.Context, sessionID string) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	s, exists := ms.sessions[sessionID]
	if !exists {
		return ErrNotFound
	}
	now := time.Now().UTC()
	s.RevokedAt = &now
	return nil
}

func (ms *MemoryStore) RevokeAllUserSessions(ctx context.Context, userID string) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	now := time.Now().UTC()
	for _, s := range ms.sessions {
		if s.UserID == userID {
			s.RevokedAt = &now
		}
	}
	return nil
}

// -----------------------------------------------------------------------------
// Profiles & Motorbikes
// -----------------------------------------------------------------------------

func (ms *MemoryStore) CreatePassengerProfile(ctx context.Context, p *models.PassengerProfile) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	ms.passengerProfiles[p.UserID] = p
	return nil
}

func (ms *MemoryStore) GetPassengerProfile(ctx context.Context, userID string) (*models.PassengerProfile, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	p, exists := ms.passengerProfiles[userID]
	if !exists {
		return nil, ErrNotFound
	}
	return p, nil
}

func (ms *MemoryStore) UpdatePassengerProfile(ctx context.Context, p *models.PassengerProfile) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	ms.passengerProfiles[p.UserID] = p
	return nil
}

func (ms *MemoryStore) CreateRiderProfile(ctx context.Context, r *models.RiderProfile) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	ms.riderProfiles[r.UserID] = r
	return nil
}

func (ms *MemoryStore) GetRiderProfile(ctx context.Context, userID string) (*models.RiderProfile, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	r, exists := ms.riderProfiles[userID]
	if !exists {
		return nil, ErrNotFound
	}
	return r, nil
}

func (ms *MemoryStore) UpdateRiderProfile(ctx context.Context, r *models.RiderProfile) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	ms.riderProfiles[r.UserID] = r
	return nil
}

func (ms *MemoryStore) ListRiders(ctx context.Context, verificationStatus string) ([]*models.RiderProfile, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	res := make([]*models.RiderProfile, 0)
	for _, r := range ms.riderProfiles {
		if verificationStatus != "" && r.VerificationStatus != verificationStatus {
			continue
		}
		res = append(res, r)
	}
	return res, nil
}

func (ms *MemoryStore) CreateMotorbike(ctx context.Context, m *models.Motorbike) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	ms.motorbikes[m.RiderID] = m
	return nil
}

func (ms *MemoryStore) GetMotorbikeByRiderID(ctx context.Context, riderID string) (*models.Motorbike, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	m, exists := ms.motorbikes[riderID]
	if !exists {
		return nil, ErrNotFound
	}
	return m, nil
}

func (ms *MemoryStore) UpdateMotorbike(ctx context.Context, m *models.Motorbike) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	ms.motorbikes[m.RiderID] = m
	return nil
}

// -----------------------------------------------------------------------------
// Verification Documents & Reviews
// -----------------------------------------------------------------------------

func (ms *MemoryStore) AddVerificationDocument(ctx context.Context, d *models.VerificationDocument) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	ms.verificationDocs[d.RiderID] = append(ms.verificationDocs[d.RiderID], d)
	return nil
}

func (ms *MemoryStore) GetVerificationDocuments(ctx context.Context, riderID string) ([]*models.VerificationDocument, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	docs := ms.verificationDocs[riderID]
	return docs, nil
}

func (ms *MemoryStore) AddVerificationReview(ctx context.Context, rev *models.VerificationReview) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	ms.verificationReviews[rev.RiderID] = append(ms.verificationReviews[rev.RiderID], rev)

	// Update rider status based on decision
	if rider, exists := ms.riderProfiles[rev.RiderID]; exists {
		switch rev.Decision {
		case "approved":
			rider.VerificationStatus = models.VerificationApproved
		case "rejected":
			rider.VerificationStatus = models.VerificationRejected
		case "needs_info":
			rider.VerificationStatus = models.VerificationUnderReview
		}
		rider.UpdatedAt = time.Now().UTC()
	}
	return nil
}

func (ms *MemoryStore) GetVerificationReviews(ctx context.Context, riderID string) ([]*models.VerificationReview, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	return ms.verificationReviews[riderID], nil
}

// -----------------------------------------------------------------------------
// Location & Presence (PostGIS logic implemented via Haversine)
// -----------------------------------------------------------------------------

func (ms *MemoryStore) UpdateRiderLocation(ctx context.Context, loc *models.RiderLocation) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	ms.riderLocations[loc.RiderID] = loc
	return nil
}

func (ms *MemoryStore) GetRiderLocation(ctx context.Context, riderID string) (*models.RiderLocation, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	loc, exists := ms.riderLocations[riderID]
	if !exists {
		return nil, ErrNotFound
	}
	return loc, nil
}

func (ms *MemoryStore) SetRiderPresence(ctx context.Context, riderID string, isOnline bool) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	ms.riderPresence[riderID] = &models.RiderPresence{
		RiderID:         riderID,
		IsOnline:        isOnline,
		LastHeartbeatAt: time.Now().UTC(),
	}
	return nil
}

func (ms *MemoryStore) GetRiderPresence(ctx context.Context, riderID string) (*models.RiderPresence, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	p, exists := ms.riderPresence[riderID]
	if !exists {
		return &models.RiderPresence{RiderID: riderID, IsOnline: false}, nil
	}
	return p, nil
}

// Haversine distance in kilometers
func haversineDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadiusKm = 6371.0

	dLat := (lat2 - lat1) * (math.Pi / 180.0)
	dLon := (lon2 - lon1) * (math.Pi / 180.0)

	lat1Rad := lat1 * (math.Pi / 180.0)
	lat2Rad := lat2 * (math.Pi / 180.0)

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Sin(dLon/2)*math.Sin(dLon/2)*math.Cos(lat1Rad)*math.Cos(lat2Rad)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return earthRadiusKm * c
}

func (ms *MemoryStore) FindNearbyEligibleRiders(ctx context.Context, lat, lng float64, radiusKm float64, limit int) ([]*models.RiderProfile, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	now := time.Now().UTC()
	type candidate struct {
		profile  *models.RiderProfile
		distance float64
	}
	var candidates []candidate

	for riderID, profile := range ms.riderProfiles {
		// 1. Must be verified
		if profile.VerificationStatus != models.VerificationApproved {
			continue
		}
		// 2. Account must be active
		if profile.AccountStatus != models.UserStatusActive {
			continue
		}
		// 3. Must be online with fresh heartbeat (within 5 minutes)
		presence, ok := ms.riderPresence[riderID]
		if !ok || !presence.IsOnline || now.Sub(presence.LastHeartbeatAt) > 5*time.Minute {
			continue
		}
		// 4. Must have active or trial subscription
		sub, ok := ms.riderSubscriptions[riderID]
		if !ok || (sub.Status != models.SubStatusActive && sub.Status != models.SubStatusTrial) || now.After(sub.ExpiresAt) {
			continue
		}
		// 5. Must not currently be on an active trip
		hasActiveTrip := false
		for _, t := range ms.trips {
			if t.RiderID != nil && *t.RiderID == riderID {
				if t.Status == models.TripStatusAssigned ||
					t.Status == models.TripStatusRiderArriving ||
					t.Status == models.TripStatusRiderArrived ||
					t.Status == models.TripStatusInProgress {
					hasActiveTrip = true
					break
				}
			}
		}
		if hasActiveTrip {
			continue
		}

		// 6. Geographic proximity
		loc, ok := ms.riderLocations[riderID]
		if !ok {
			continue
		}
		dist := haversineDistance(lat, lng, loc.Location.Latitude, loc.Location.Longitude)
		if dist <= radiusKm {
			candidates = append(candidates, candidate{profile: profile, distance: dist})
		}
	}

	// Rank by closest distance
	sort.Slice(candidates, func(i, j int) bool {
		return candidates[i].distance < candidates[j].distance
	})

	if limit > len(candidates) {
		limit = len(candidates)
	}

	res := make([]*models.RiderProfile, 0, limit)
	for i := 0; i < limit; i++ {
		res = append(res, candidates[i].profile)
	}
	return res, nil
}

// -----------------------------------------------------------------------------
// Pricing & Quotes
// -----------------------------------------------------------------------------

func (ms *MemoryStore) GetActivePricingRule(ctx context.Context) (*models.PricingRule, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	for _, rule := range ms.pricingRules {
		if rule.Active {
			return rule, nil
		}
	}
	return nil, ErrNotFound
}

func (ms *MemoryStore) CreatePricingRule(ctx context.Context, pr *models.PricingRule) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	// Deactivate existing rules if new one is active
	if pr.Active {
		for _, r := range ms.pricingRules {
			r.Active = false
		}
	}
	ms.pricingRules[pr.ID] = pr
	return nil
}

func (ms *MemoryStore) ListPricingRules(ctx context.Context) ([]*models.PricingRule, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	res := make([]*models.PricingRule, 0, len(ms.pricingRules))
	for _, r := range ms.pricingRules {
		res = append(res, r)
	}
	sort.Slice(res, func(i, j int) bool {
		return res[i].Version > res[j].Version
	})
	return res, nil
}

func (ms *MemoryStore) CreateFareQuote(ctx context.Context, q *models.FareQuote) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	ms.fareQuotes[q.ID] = q
	return nil
}

func (ms *MemoryStore) GetFareQuote(ctx context.Context, quoteID string) (*models.FareQuote, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	q, exists := ms.fareQuotes[quoteID]
	if !exists {
		return nil, ErrNotFound
	}
	return q, nil
}

// -----------------------------------------------------------------------------
// Trips, Offers & State Machine
// -----------------------------------------------------------------------------

func (ms *MemoryStore) CreateTrip(ctx context.Context, t *models.Trip) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	ms.trips[t.ID] = t
	return nil
}

func (ms *MemoryStore) GetTripByID(ctx context.Context, tripID string) (*models.Trip, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	t, exists := ms.trips[tripID]
	if !exists {
		return nil, ErrNotFound
	}

	// Enrich trip with passenger and rider details
	enriched := *t
	if p, ok := ms.passengerProfiles[t.PassengerID]; ok {
		enriched.PassengerName = &p.DisplayName
	}
	if u, ok := ms.users[t.PassengerID]; ok {
		enriched.PassengerPhone = &u.PhoneE164
	}
	if t.RiderID != nil {
		if r, ok := ms.riderProfiles[*t.RiderID]; ok {
			enriched.RiderName = &r.DisplayName
			enriched.RiderRating = &r.Rating
		}
		if u, ok := ms.users[*t.RiderID]; ok {
			enriched.RiderPhone = &u.PhoneE164
		}
		if mb, ok := ms.motorbikes[*t.RiderID]; ok {
			enriched.Motorbike = mb
		}
	}
	return &enriched, nil
}

func (ms *MemoryStore) UpdateTripStatus(ctx context.Context, tripID, status, actorID string, meta map[string]any) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	t, exists := ms.trips[tripID]
	if !exists {
		return ErrNotFound
	}

	// Validate state machine transitions
	valid := false
	switch t.Status {
	case models.TripStatusRequested:
		valid = (status == models.TripStatusSearching || status == models.TripStatusCancelled)
	case models.TripStatusSearching:
		valid = (status == models.TripStatusAssigned || status == models.TripStatusNoRiderAvail || status == models.TripStatusCancelled)
	case models.TripStatusAssigned:
		valid = (status == models.TripStatusRiderArriving || status == models.TripStatusRiderArrived || status == models.TripStatusCancelled)
	case models.TripStatusRiderArriving:
		valid = (status == models.TripStatusRiderArrived || status == models.TripStatusCancelled)
	case models.TripStatusRiderArrived:
		valid = (status == models.TripStatusInProgress || status == models.TripStatusCancelled)
	case models.TripStatusInProgress:
		valid = (status == models.TripStatusCompleted)
	}

	if !valid {
		return fmt.Errorf("%w: cannot transition from %s to %s", ErrInvalidState, t.Status, status)
	}

	fromStatus := t.Status
	t.Status = status
	t.UpdatedAt = time.Now().UTC()

	// Update completed trip count on rider if completed
	if status == models.TripStatusCompleted && t.RiderID != nil {
		if r, ok := ms.riderProfiles[*t.RiderID]; ok {
			r.CompletedTrips++
		}
	}

	// Record trip event
	ev := &models.TripEvent{
		ID:         fmt.Sprintf("ev_%d", time.Now().UnixNano()),
		TripID:     tripID,
		ActorID:    actorID,
		FromStatus: fromStatus,
		ToStatus:   status,
		Metadata:   meta,
		CreatedAt:  time.Now().UTC(),
	}
	ms.tripEvents[tripID] = append(ms.tripEvents[tripID], ev)
	return nil
}

// AssignTripToRider performs an atomic assignment invariant:
// Exactly one rider can be assigned to a trip.
func (ms *MemoryStore) AssignTripToRider(ctx context.Context, tripID, riderID string) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	t, exists := ms.trips[tripID]
	if !exists {
		return ErrNotFound
	}

	if t.RiderID != nil || t.Status == models.TripStatusAssigned {
		return ErrTripAlreadyAssigned
	}

	fromStatus := t.Status
	t.RiderID = &riderID
	t.Status = models.TripStatusAssigned
	t.UpdatedAt = time.Now().UTC()

	ev := &models.TripEvent{
		ID:         fmt.Sprintf("ev_%d", time.Now().UnixNano()),
		TripID:     tripID,
		ActorID:    riderID,
		FromStatus: fromStatus,
		ToStatus:   models.TripStatusAssigned,
		Metadata:   map[string]any{"rider_id": riderID},
		CreatedAt:  time.Now().UTC(),
	}
	ms.tripEvents[tripID] = append(ms.tripEvents[tripID], ev)
	return nil
}

func (ms *MemoryStore) ListTrips(ctx context.Context, passengerID, riderID, status string) ([]*models.Trip, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	res := make([]*models.Trip, 0)
	for _, t := range ms.trips {
		if passengerID != "" && t.PassengerID != passengerID {
			continue
		}
		if riderID != "" && (t.RiderID == nil || *t.RiderID != riderID) {
			continue
		}
		if status != "" && t.Status != status {
			continue
		}
		enriched := *t
		if p, ok := ms.passengerProfiles[t.PassengerID]; ok {
			enriched.PassengerName = &p.DisplayName
		}
		if t.RiderID != nil {
			if r, ok := ms.riderProfiles[*t.RiderID]; ok {
				enriched.RiderName = &r.DisplayName
			}
		}
		res = append(res, &enriched)
	}

	sort.Slice(res, func(i, j int) bool {
		return res[i].CreatedAt.After(res[j].CreatedAt)
	})
	return res, nil
}

func (ms *MemoryStore) GetActiveTripForUser(ctx context.Context, userID, role string) (*models.Trip, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	for _, t := range ms.trips {
		isActive := (t.Status == models.TripStatusRequested ||
			t.Status == models.TripStatusSearching ||
			t.Status == models.TripStatusAssigned ||
			t.Status == models.TripStatusRiderArriving ||
			t.Status == models.TripStatusRiderArrived ||
			t.Status == models.TripStatusInProgress)

		if !isActive {
			continue
		}

		if role == models.RolePassenger && t.PassengerID == userID {
			enriched := *t
			if t.RiderID != nil {
				if r, ok := ms.riderProfiles[*t.RiderID]; ok {
					enriched.RiderName = &r.DisplayName
					enriched.RiderRating = &r.Rating
				}
				if u, ok := ms.users[*t.RiderID]; ok {
					enriched.RiderPhone = &u.PhoneE164
				}
				if mb, ok := ms.motorbikes[*t.RiderID]; ok {
					enriched.Motorbike = mb
				}
			}
			return &enriched, nil
		}

		if role == models.RoleRider && t.RiderID != nil && *t.RiderID == userID {
			enriched := *t
			if p, ok := ms.passengerProfiles[t.PassengerID]; ok {
				enriched.PassengerName = &p.DisplayName
			}
			if u, ok := ms.users[t.PassengerID]; ok {
				enriched.PassengerPhone = &u.PhoneE164
			}
			return &enriched, nil
		}
	}

	return nil, ErrNotFound
}

func (ms *MemoryStore) CreateTripOffer(ctx context.Context, o *models.TripOffer) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	ms.tripOffers[o.ID] = o
	return nil
}

func (ms *MemoryStore) GetTripOfferByID(ctx context.Context, offerID string) (*models.TripOffer, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	o, exists := ms.tripOffers[offerID]
	if !exists {
		return nil, ErrNotFound
	}
	enriched := *o
	if t, ok := ms.trips[o.TripID]; ok {
		enriched.Trip = t
	}
	return &enriched, nil
}

func (ms *MemoryStore) GetActiveOfferForRider(ctx context.Context, riderID string) (*models.TripOffer, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	now := time.Now().UTC()
	for _, o := range ms.tripOffers {
		if o.RiderID == riderID && o.Status == models.OfferStatusDispatched {
			if now.Before(o.ExpiresAt) {
				enriched := *o
				if t, ok := ms.trips[o.TripID]; ok {
					enriched.Trip = t
				}
				return &enriched, nil
			}
		}
	}
	return nil, ErrNotFound
}

func (ms *MemoryStore) UpdateOfferStatus(ctx context.Context, offerID, status string) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	o, exists := ms.tripOffers[offerID]
	if !exists {
		return ErrNotFound
	}
	o.Status = status
	return nil
}

func (ms *MemoryStore) ListTripEvents(ctx context.Context, tripID string) ([]*models.TripEvent, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	return ms.tripEvents[tripID], nil
}

func (ms *MemoryStore) RecordTripEvent(ctx context.Context, ev *models.TripEvent) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	ms.tripEvents[ev.TripID] = append(ms.tripEvents[ev.TripID], ev)
	return nil
}

// -----------------------------------------------------------------------------
// Subscriptions
// -----------------------------------------------------------------------------

func (ms *MemoryStore) CreateSubscriptionPlan(ctx context.Context, plan *models.SubscriptionPlan) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	ms.subscriptionPlans[plan.ID] = plan
	return nil
}

func (ms *MemoryStore) GetSubscriptionPlanByID(ctx context.Context, planID string) (*models.SubscriptionPlan, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	p, exists := ms.subscriptionPlans[planID]
	if !exists {
		return nil, ErrNotFound
	}
	return p, nil
}

func (ms *MemoryStore) ListSubscriptionPlans(ctx context.Context, activeOnly bool) ([]*models.SubscriptionPlan, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	res := make([]*models.SubscriptionPlan, 0, len(ms.subscriptionPlans))
	for _, p := range ms.subscriptionPlans {
		if activeOnly && !p.Active {
			continue
		}
		res = append(res, p)
	}
	return res, nil
}

func (ms *MemoryStore) GetRiderSubscription(ctx context.Context, riderID string) (*models.RiderSubscription, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	sub, exists := ms.riderSubscriptions[riderID]
	if !exists {
		return nil, ErrNotFound
	}
	enriched := *sub
	if plan, ok := ms.subscriptionPlans[sub.PlanID]; ok {
		enriched.Plan = plan
	}
	return &enriched, nil
}

func (ms *MemoryStore) UpsertRiderSubscription(ctx context.Context, sub *models.RiderSubscription) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	ms.riderSubscriptions[sub.RiderID] = sub
	return nil
}

func (ms *MemoryStore) ListRiderSubscriptions(ctx context.Context) ([]*models.RiderSubscription, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	res := make([]*models.RiderSubscription, 0, len(ms.riderSubscriptions))
	for _, sub := range ms.riderSubscriptions {
		enriched := *sub
		if plan, ok := ms.subscriptionPlans[sub.PlanID]; ok {
			enriched.Plan = plan
		}
		res = append(res, &enriched)
	}
	return res, nil
}

// -----------------------------------------------------------------------------
// Safety Reports & Incidents
// -----------------------------------------------------------------------------

func (ms *MemoryStore) CreateSafetyReport(ctx context.Context, rep *models.SafetyReport) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	ms.safetyReports[rep.ID] = rep
	return nil
}

func (ms *MemoryStore) GetSafetyReportByID(ctx context.Context, reportID string) (*models.SafetyReport, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	rep, exists := ms.safetyReports[reportID]
	if !exists {
		return nil, ErrNotFound
	}
	return rep, nil
}

func (ms *MemoryStore) UpdateSafetyReportStatus(ctx context.Context, reportID, status, notes string) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	rep, exists := ms.safetyReports[reportID]
	if !exists {
		return ErrNotFound
	}
	rep.Status = status
	if notes != "" {
		rep.Notes = notes
	}
	rep.UpdatedAt = time.Now().UTC()
	return nil
}

func (ms *MemoryStore) ListSafetyReports(ctx context.Context, status string) ([]*models.SafetyReport, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	res := make([]*models.SafetyReport, 0)
	for _, rep := range ms.safetyReports {
		if status != "" && rep.Status != status {
			continue
		}
		res = append(res, rep)
	}
	sort.Slice(res, func(i, j int) bool {
		return res[i].CreatedAt.After(res[j].CreatedAt)
	})
	return res, nil
}

// -----------------------------------------------------------------------------
// Audit Logs
// -----------------------------------------------------------------------------

func (ms *MemoryStore) RecordAuditLog(ctx context.Context, log *models.AuditLog) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	ms.auditLogs = append(ms.auditLogs, log)
	return nil
}

func (ms *MemoryStore) ListAuditLogs(ctx context.Context, limit int) ([]*models.AuditLog, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	count := len(ms.auditLogs)
	if limit <= 0 || limit > count {
		limit = count
	}

	res := make([]*models.AuditLog, limit)
	for i := 0; i < limit; i++ {
		res[i] = ms.auditLogs[count-1-i]
	}
	return res, nil
}

// -----------------------------------------------------------------------------
// Real Platform Operational Metrics (docs/PRD.md & docs/API.md)
// -----------------------------------------------------------------------------

func (ms *MemoryStore) GetAdminMetrics(ctx context.Context) (map[string]any, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	totalPassengers := len(ms.passengerProfiles)
	totalRiders := len(ms.riderProfiles)
	verifiedRiders := 0
	pendingVerifications := 0
	onlineRiders := 0
	activeTrips := 0
	completedTrips := 0
	cancelledTrips := 0

	for _, r := range ms.riderProfiles {
		if r.VerificationStatus == models.VerificationApproved {
			verifiedRiders++
		} else if r.VerificationStatus == models.VerificationPending || r.VerificationStatus == models.VerificationUnderReview {
			pendingVerifications++
		}
	}

	now := time.Now().UTC()
	for _, p := range ms.riderPresence {
		if p.IsOnline && now.Sub(p.LastHeartbeatAt) <= 5*time.Minute {
			onlineRiders++
		}
	}

	for _, t := range ms.trips {
		switch t.Status {
		case models.TripStatusRequested, models.TripStatusSearching, models.TripStatusAssigned, models.TripStatusRiderArriving, models.TripStatusRiderArrived, models.TripStatusInProgress:
			activeTrips++
		case models.TripStatusCompleted:
			completedTrips++
		case models.TripStatusCancelled:
			cancelledTrips++
		}
	}

	openIncidents := 0
	for _, rep := range ms.safetyReports {
		if rep.Status == "open" || rep.Status == "investigating" {
			openIncidents++
		}
	}

	return map[string]any{
		"total_passengers":      totalPassengers,
		"total_riders":          totalRiders,
		"verified_riders":       verifiedRiders,
		"pending_verifications": pendingVerifications,
		"online_riders":         onlineRiders,
		"active_trips":          activeTrips,
		"completed_trips":       completedTrips,
		"cancelled_trips":       cancelledTrips,
		"subscription_revenue":  0, // Minor units
		"open_incidents":        openIncidents,
	}, nil
}
