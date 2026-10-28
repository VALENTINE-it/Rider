package http

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/VALENTINE-it/Rider/backend/internal/models"
	"github.com/VALENTINE-it/Rider/backend/internal/store"
	appws "github.com/VALENTINE-it/Rider/backend/internal/websocket"
	"golang.org/x/crypto/bcrypt"
)

var phoneRegex = regexp.MustCompile(`^\+254[17][0-9]{8}$`)

type Router struct {
	store store.Store
	hub   *appws.Hub
}

func NewRouter(s store.Store, hub *appws.Hub) *Router {
	return &Router{
		store: s,
		hub:   hub,
	}
}

func generateID(prefix string) string {
	b := make([]byte, 8)
	_, _ = rand.Read(b)
	return prefix + "_" + hex.EncodeToString(b)
}

func generateSessionToken() string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func (rt *Router) Routes() http.Handler {
	mux := http.NewServeMux()

	// 1. Health Endpoints
	mux.HandleFunc("/health/live", rt.handleHealthLive)
	mux.HandleFunc("/health/ready", rt.handleHealthReady)

	// 2. Auth Endpoints
	mux.HandleFunc("/api/v1/auth/csrf", rt.handleCSRF)
	mux.HandleFunc("/api/v1/auth/register", ValidateCSRF(rt.handleRegister))
	mux.HandleFunc("/api/v1/auth/login", ValidateCSRF(rt.handleLogin))
	mux.HandleFunc("/api/v1/admin/login", ValidateCSRF(rt.handleAdminLogin))
	mux.HandleFunc("/api/v1/auth/logout", RequireAuth(ValidateCSRF(rt.handleLogout)))
	mux.HandleFunc("/api/v1/auth/me", RequireAuth(rt.handleMe))

	// 3. Pricing & Quotes
	mux.HandleFunc("/api/v1/quotes", ValidateCSRF(rt.handleQuotes))

	// 4. Passenger & Rider Trips
	mux.HandleFunc("/api/v1/trips", RequireAuth(rt.handleTrips))
	mux.HandleFunc("/api/v1/trips/active", RequireAuth(rt.handleActiveTrip))
	mux.HandleFunc("/api/v1/trips/", RequireAuth(rt.handleTripSubRoutes))

	// 5. Rider Operations
	mux.HandleFunc("/api/v1/rider/presence", RequireRole(models.RoleRider)(ValidateCSRF(rt.handleRiderPresence)))
	mux.HandleFunc("/api/v1/rider/location", RequireRole(models.RoleRider)(ValidateCSRF(rt.handleRiderLocation)))
	mux.HandleFunc("/api/v1/rider/offers/active", RequireRole(models.RoleRider)(rt.handleRiderActiveOffer))
	mux.HandleFunc("/api/v1/rider/earnings", RequireRole(models.RoleRider)(rt.handleRiderEarnings))
	mux.HandleFunc("/api/v1/rider/subscription", RequireRole(models.RoleRider)(rt.handleRiderSubscription))
	mux.HandleFunc("/api/v1/rider/motorbikes", RequireRole(models.RoleRider)(ValidateCSRF(rt.handleRiderMotorbike)))
	mux.HandleFunc("/api/v1/rider/documents", RequireRole(models.RoleRider)(ValidateCSRF(rt.handleRiderDocuments)))

	// 6. Passenger Profile
	mux.HandleFunc("/api/v1/passenger/profile", RequireRole(models.RolePassenger)(rt.handlePassengerProfile))

	// 7. Safety & SOS Reporting
	mux.HandleFunc("/api/v1/safety/reports", RequireAuth(ValidateCSRF(rt.handleSafetyReport)))

	// 8. Administrative Operations (Strict Role Isolation: admin / super_admin only)
	adminAuth := RequireRole(models.RoleAdmin, models.RoleSuperAdmin)
	mux.HandleFunc("/api/v1/admin/overview", adminAuth(rt.handleAdminOverview))
	mux.HandleFunc("/api/v1/admin/passengers", adminAuth(rt.handleAdminPassengers))
	mux.HandleFunc("/api/v1/admin/users/", adminAuth(ValidateCSRF(rt.handleAdminUserStatus)))
	mux.HandleFunc("/api/v1/admin/riders", adminAuth(rt.handleAdminRiders))
	mux.HandleFunc("/api/v1/admin/riders/", adminAuth(ValidateCSRF(rt.handleAdminRiderReview)))
	mux.HandleFunc("/api/v1/admin/trips", adminAuth(rt.handleAdminTrips))
	mux.HandleFunc("/api/v1/admin/pricing", adminAuth(rt.handleAdminPricing))
	mux.HandleFunc("/api/v1/admin/subscriptions", adminAuth(rt.handleAdminSubscriptions))
	mux.HandleFunc("/api/v1/admin/subscriptions/plans", adminAuth(ValidateCSRF(rt.handleAdminSubscriptionPlan)))
	mux.HandleFunc("/api/v1/admin/subscriptions/grant", adminAuth(ValidateCSRF(rt.handleAdminGrantSubscription)))
	mux.HandleFunc("/api/v1/admin/safety", adminAuth(rt.handleAdminSafetyList))
	mux.HandleFunc("/api/v1/admin/safety/", adminAuth(ValidateCSRF(rt.handleAdminSafetyStatus)))
	mux.HandleFunc("/api/v1/admin/administrators", adminAuth(rt.handleAdminAdministrators))
	mux.HandleFunc("/api/v1/admin/audit-logs", adminAuth(rt.handleAdminAuditLogs))

	// 9. Real-Time WebSockets
	mux.HandleFunc("/api/v1/ws", rt.handleWebSocket)

	return mux
}

// -----------------------------------------------------------------------------
// Health
// -----------------------------------------------------------------------------

func (rt *Router) handleHealthLive(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	JSON(w, http.StatusOK, map[string]any{
		"status":    "live",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}, reqID)
}

func (rt *Router) handleHealthReady(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	JSON(w, http.StatusOK, map[string]any{
		"status":   "ready",
		"database": "operational",
		"version":  "1.0.0",
	}, reqID)
}

// -----------------------------------------------------------------------------
// Authentication
// -----------------------------------------------------------------------------

func (rt *Router) handleCSRF(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	token := GenerateCSRFToken()
	JSON(w, http.StatusOK, map[string]string{
		"csrf_token": token,
	}, reqID)
}

func (rt *Router) handleRegister(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	if r.Method != http.MethodPost {
		JSONError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "POST required", nil, reqID)
		return
	}

	var req struct {
		FullName       string `json:"full_name"`
		Phone          string `json:"phone"`
		Password       string `json:"password"`
		Role           string `json:"role"`
		MotorbikePlate string `json:"motorbike_plate,omitempty"`
		MotorbikeModel string `json:"motorbike_model,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		JSONError(w, http.StatusBadRequest, "BAD_REQUEST", "Invalid JSON payload", nil, reqID)
		return
	}

	phone := strings.ReplaceAll(strings.TrimSpace(req.Phone), " ", "")
	if !strings.HasPrefix(phone, "+") {
		// Normalize 07... or 01... to +254...
		if strings.HasPrefix(phone, "0") {
			phone = "+254" + phone[1:]
		} else if strings.HasPrefix(phone, "254") {
			phone = "+" + phone
		}
	}

	if !phoneRegex.MatchString(phone) {
		JSONError(w, http.StatusUnprocessableEntity, "VALIDATION_FAILED", "Please provide a valid Kenyan phone number (e.g. +254712345678)", []ErrorDetail{
			{Field: "phone", Reason: "must_be_kenyan_e164"},
		}, reqID)
		return
	}

	if len(req.Password) < 8 {
		JSONError(w, http.StatusUnprocessableEntity, "VALIDATION_FAILED", "Password must be at least 8 characters long", []ErrorDetail{
			{Field: "password", Reason: "too_short"},
		}, reqID)
		return
	}

	role := strings.ToLower(strings.TrimSpace(req.Role))
	if role != models.RolePassenger && role != models.RoleRider {
		// STRICT ADMIN SEPARATION: admin accounts cannot be created via public registration!
		JSONError(w, http.StatusBadRequest, "BAD_REQUEST", "Role must be 'passenger' or 'rider'", nil, reqID)
		return
	}

	pwdHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		JSONError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Password processing error", nil, reqID)
		return
	}

	now := time.Now().UTC()
	userID := generateID("usr")
	user := &models.User{
		ID:              userID,
		PhoneE164:       phone,
		PhoneVerifiedAt: &now,
		Status:          models.UserStatusActive,
		Roles:           []string{role},
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	if err := rt.store.CreateUser(r.Context(), user, string(pwdHash)); err != nil {
		if err == store.ErrDuplicatePhone {
			JSONError(w, http.StatusConflict, "PHONE_ALREADY_REGISTERED", "An account with this phone number already exists", nil, reqID)
			return
		}
		JSONError(w, http.StatusInternalServerError, "DATABASE_ERROR", err.Error(), nil, reqID)
		return
	}

	// Create profile based on role
	if role == models.RolePassenger {
		pProfile := &models.PassengerProfile{
			UserID:      userID,
			DisplayName: req.FullName,
			CreatedAt:   now,
		}
		_ = rt.store.CreatePassengerProfile(r.Context(), pProfile)
	} else if role == models.RoleRider {
		rProfile := &models.RiderProfile{
			UserID:             userID,
			DisplayName:        req.FullName,
			VerificationStatus: models.VerificationPending,
			AccountStatus:      models.UserStatusActive,
			Rating:             5.0,
			CompletedTrips:     0,
			CreatedAt:          now,
			UpdatedAt:          now,
		}
		_ = rt.store.CreateRiderProfile(r.Context(), rProfile)

		// Create motorbike
		plate := req.MotorbikePlate
		if plate == "" {
			plate = "KMD " + strconv.Itoa(100+int(now.Unix()%900)) + "X"
		}
		model := req.MotorbikeModel
		if model == "" {
			model = "Bajaj Boxer 150"
		}
		mb := &models.Motorbike{
			ID:             generateID("mb"),
			RiderID:        userID,
			PlateNumber:    plate,
			Model:          model,
			HelmetIncluded: true,
			Status:         models.VerificationPending,
			CreatedAt:      now,
		}
		_ = rt.store.CreateMotorbike(r.Context(), mb)

		// Auto-grant 30-day pilot trial subscription
		sub := &models.RiderSubscription{
			ID:        generateID("sub"),
			RiderID:   userID,
			PlanID:    "plan_pilot_trial",
			Status:    models.SubStatusTrial,
			StartsAt:  now,
			ExpiresAt: now.Add(30 * 24 * time.Hour),
			CreatedAt: now,
		}
		_ = rt.store.UpsertRiderSubscription(r.Context(), sub)
	}

	// Create session and set cookie
	rawToken := generateSessionToken()
	sessionID := generateID("sess")
	sess := &models.Session{
		ID:         sessionID,
		UserID:     userID,
		TokenHash:  HashToken(rawToken),
		ExpiresAt:  now.Add(24 * time.Hour),
		CreatedAt:  now,
		LastSeenAt: now,
	}
	_ = rt.store.CreateSession(r.Context(), sess)

	http.SetCookie(w, &http.Cookie{
		Name:     "rider_session",
		Value:    rawToken,
		Path:     "/",
		Expires:  sess.ExpiresAt,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   false, // Set true in TLS
	})

	JSON(w, http.StatusCreated, map[string]any{
		"user": map[string]any{
			"id":         user.ID,
			"phone":      user.PhoneE164,
			"full_name":  req.FullName,
			"role":       role,
			"roles":      user.Roles,
			"created_at": user.CreatedAt,
		},
	}, reqID)
}

func (rt *Router) handleLogin(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	if r.Method != http.MethodPost {
		JSONError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "POST required", nil, reqID)
		return
	}

	var req struct {
		Phone    string `json:"phone"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		JSONError(w, http.StatusBadRequest, "BAD_REQUEST", "Invalid JSON payload", nil, reqID)
		return
	}

	phone := strings.ReplaceAll(strings.TrimSpace(req.Phone), " ", "")
	if !strings.HasPrefix(phone, "+") {
		if strings.HasPrefix(phone, "0") {
			phone = "+254" + phone[1:]
		} else if strings.HasPrefix(phone, "254") {
			phone = "+" + phone
		}
	}

	user, err := rt.store.GetUserByPhone(r.Context(), phone)
	if err != nil || user == nil {
		JSONError(w, http.StatusUnauthorized, "INVALID_CREDENTIALS", "Invalid phone number or password", nil, reqID)
		return
	}

	if user.Status == models.UserStatusSuspended {
		JSONError(w, http.StatusForbidden, "ACCOUNT_SUSPENDED", "Your account has been suspended. Please contact support.", nil, reqID)
		return
	}

	hash, err := rt.store.GetPasswordHash(r.Context(), user.ID)
	if err != nil || bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)) != nil {
		JSONError(w, http.StatusUnauthorized, "INVALID_CREDENTIALS", "Invalid phone number or password", nil, reqID)
		return
	}

	now := time.Now().UTC()
	rawToken := generateSessionToken()
	sessionID := generateID("sess")
	sess := &models.Session{
		ID:         sessionID,
		UserID:     user.ID,
		TokenHash:  HashToken(rawToken),
		ExpiresAt:  now.Add(24 * time.Hour),
		CreatedAt:  now,
		LastSeenAt: now,
	}
	_ = rt.store.CreateSession(r.Context(), sess)

	http.SetCookie(w, &http.Cookie{
		Name:     "rider_session",
		Value:    rawToken,
		Path:     "/",
		Expires:  sess.ExpiresAt,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   false,
	})

	// Fetch primary display name
	displayName := ""
	if p, err := rt.store.GetPassengerProfile(r.Context(), user.ID); err == nil {
		displayName = p.DisplayName
	} else if rProf, err := rt.store.GetRiderProfile(r.Context(), user.ID); err == nil {
		displayName = rProf.DisplayName
	}

	primaryRole := user.Roles[0]
	JSON(w, http.StatusOK, map[string]any{
		"user": map[string]any{
			"id":        user.ID,
			"phone":     user.PhoneE164,
			"full_name": displayName,
			"role":      primaryRole,
			"roles":     user.Roles,
		},
	}, reqID)
}

func (rt *Router) handleAdminLogin(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	if r.Method != http.MethodPost {
		JSONError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "POST required", nil, reqID)
		return
	}

	var req struct {
		Phone    string `json:"phone"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		JSONError(w, http.StatusBadRequest, "BAD_REQUEST", "Invalid JSON payload", nil, reqID)
		return
	}

	phone := strings.ReplaceAll(strings.TrimSpace(req.Phone), " ", "")
	if !strings.HasPrefix(phone, "+") {
		if strings.HasPrefix(phone, "0") {
			phone = "+254" + phone[1:]
		} else if strings.HasPrefix(phone, "254") {
			phone = "+" + phone
		}
	}

	user, err := rt.store.GetUserByPhone(r.Context(), phone)
	if err != nil || user == nil {
		JSONError(w, http.StatusUnauthorized, "INVALID_CREDENTIALS", "Invalid administrator credentials", nil, reqID)
		return
	}

	// Enforce that the user has admin role!
	isAdmin := false
	for _, r := range user.Roles {
		if r == models.RoleAdmin || r == models.RoleSuperAdmin {
			isAdmin = true
			break
		}
	}

	if !isAdmin {
		JSONError(w, http.StatusForbidden, "FORBIDDEN", "Unauthorized administrative access attempt", nil, reqID)
		return
	}

	hash, err := rt.store.GetPasswordHash(r.Context(), user.ID)
	if err != nil || bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)) != nil {
		JSONError(w, http.StatusUnauthorized, "INVALID_CREDENTIALS", "Invalid administrator credentials", nil, reqID)
		return
	}

	now := time.Now().UTC()
	rawToken := generateSessionToken()
	sessionID := generateID("sess_adm")
	sess := &models.Session{
		ID:         sessionID,
		UserID:     user.ID,
		TokenHash:  HashToken(rawToken),
		ExpiresAt:  now.Add(12 * time.Hour),
		CreatedAt:  now,
		LastSeenAt: now,
	}
	_ = rt.store.CreateSession(r.Context(), sess)

	http.SetCookie(w, &http.Cookie{
		Name:     "rider_session",
		Value:    rawToken,
		Path:     "/",
		Expires:  sess.ExpiresAt,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   false,
	})

	JSON(w, http.StatusOK, map[string]any{
		"user": map[string]any{
			"id":        user.ID,
			"phone":     user.PhoneE164,
			"full_name": "Platform Administrator",
			"role":      models.RoleAdmin,
			"roles":     user.Roles,
		},
	}, reqID)
}

func (rt *Router) handleLogout(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	if cookie, err := r.Cookie("rider_session"); err == nil {
		tokenHash := HashToken(cookie.Value)
		sess, err := rt.store.GetSessionByTokenHash(r.Context(), tokenHash)
		if err == nil && sess != nil {
			_ = rt.store.RevokeSession(r.Context(), sess.ID)
		}
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "rider_session",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
	})

	JSON(w, http.StatusOK, map[string]string{
		"message": "Signed out successfully",
	}, reqID)
}

func (rt *Router) handleMe(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	user := GetUserFromContext(r)
	if user == nil {
		JSONError(w, http.StatusUnauthorized, "UNAUTHENTICATED", "No active session", nil, reqID)
		return
	}

	data := map[string]any{
		"id":         user.ID,
		"phone":      user.PhoneE164,
		"status":     user.Status,
		"roles":      user.Roles,
		"created_at": user.CreatedAt,
	}

	// Include profile details
	if p, err := rt.store.GetPassengerProfile(r.Context(), user.ID); err == nil {
		data["passenger_profile"] = p
		data["display_name"] = p.DisplayName
	}

	if rProf, err := rt.store.GetRiderProfile(r.Context(), user.ID); err == nil {
		data["rider_profile"] = rProf
		if data["display_name"] == nil {
			data["display_name"] = rProf.DisplayName
		}
		if mb, err := rt.store.GetMotorbikeByRiderID(r.Context(), user.ID); err == nil {
			data["motorbike"] = mb
		}
		if sub, err := rt.store.GetRiderSubscription(r.Context(), user.ID); err == nil {
			data["subscription"] = sub
		}
		if pres, err := rt.store.GetRiderPresence(r.Context(), user.ID); err == nil {
			data["presence"] = pres
		}
	}

	JSON(w, http.StatusOK, data, reqID)
}

// -----------------------------------------------------------------------------
// Pricing & Fare Quotes
// -----------------------------------------------------------------------------

func (rt *Router) handleQuotes(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	if r.Method != http.MethodPost {
		JSONError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "POST required", nil, reqID)
		return
	}

	var req struct {
		PickupAddress string  `json:"pickup_address"`
		DestAddress   string  `json:"dest_address"`
		DistanceKm    float64 `json:"distance_km"`
		PickupLat     float64 `json:"pickup_lat"`
		PickupLng     float64 `json:"pickup_lng"`
		DestLat       float64 `json:"dest_lat"`
		DestLng       float64 `json:"dest_lng"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	rule, err := rt.store.GetActivePricingRule(r.Context())
	if err != nil {
		// Fallback default rule
		rule = &models.PricingRule{
			Currency:      "KES",
			BaseFareMinor: 5000,
			PerKmMinor:    3500,
			PerMinMinor:   200,
			MinFareMinor:  10000,
			Version:       1,
		}
	}

	dist := req.DistanceKm
	if dist <= 0 {
		if strings.Contains(strings.ToUpper(req.DestAddress), "JKIA") {
			dist = 16.5
		} else if strings.Contains(strings.ToUpper(req.DestAddress), "KAREN") {
			dist = 14.2
		} else {
			dist = 3.8
		}
	}

	durationMinutes := int(dist * 2.8)
	if durationMinutes < 5 {
		durationMinutes = 5
	}

	// Authoritative fare formula:
	// Fare = Base + (Distance * PerKm) + (Duration * PerMin)
	computedFare := rule.BaseFareMinor + int64(dist*float64(rule.PerKmMinor)) + int64(durationMinutes)*rule.PerMinMinor
	if computedFare < rule.MinFareMinor {
		computedFare = rule.MinFareMinor
	}

	user := GetUserFromContext(r)
	passengerID := "guest"
	if user != nil {
		passengerID = user.ID
	}

	now := time.Now().UTC()
	quoteID := generateID("quo")
	quote := &models.FareQuote{
		ID:              quoteID,
		PassengerID:     passengerID,
		Pickup:          models.Coordinates{Latitude: req.PickupLat, Longitude: req.PickupLng},
		Destination:     models.Coordinates{Latitude: req.DestLat, Longitude: req.DestLng},
		PickupAddress:   req.PickupAddress,
		DestAddress:     req.DestAddress,
		DistanceMeters:  int(dist * 1000),
		DurationSeconds: durationMinutes * 60,
		Currency:        rule.Currency,
		FareMinor:       computedFare,
		PricingVersion:  rule.Version,
		ExpiresAt:       now.Add(10 * time.Minute),
		CreatedAt:       now,
	}

	_ = rt.store.CreateFareQuote(r.Context(), quote)

	JSON(w, http.StatusOK, map[string]any{
		"id":               quote.ID,
		"quote_id":         quote.ID,
		"fare_minor":       quote.FareMinor,
		"fare_display":     fmt.Sprintf("KSh %.2f", float64(quote.FareMinor)/100.0),
		"currency":         quote.Currency,
		"distance_km":      dist,
		"duration_minutes": durationMinutes,
		"commission_rate":  "0%", // Strict 0% platform commission on trips
		"pricing_version":  quote.PricingVersion,
		"expires_at":       quote.ExpiresAt.Format(time.RFC3339),
	}, reqID)
}

// -----------------------------------------------------------------------------
// Trips & Rider Matching Engine
// -----------------------------------------------------------------------------

func (rt *Router) handleTrips(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	user := GetUserFromContext(r)

	if r.Method == http.MethodPost {
		// Passenger creates a ride booking
		var req struct {
			PickupAddress string  `json:"pickup_address"`
			DestAddress   string  `json:"dest_address"`
			FareMinor     int64   `json:"fare_minor"`
			PickupLat     float64 `json:"pickup_lat"`
			PickupLng     float64 `json:"pickup_lng"`
			DestLat       float64 `json:"dest_lat"`
			DestLng       float64 `json:"dest_lng"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			JSONError(w, http.StatusBadRequest, "BAD_REQUEST", "Invalid JSON payload", nil, reqID)
			return
		}

		if req.PickupAddress == "" || req.DestAddress == "" {
			JSONError(w, http.StatusUnprocessableEntity, "VALIDATION_FAILED", "Pickup and destination addresses are required", nil, reqID)
			return
		}

		// Prevent duplicate active trip for passenger
		if activeTrip, err := rt.store.GetActiveTripForUser(r.Context(), user.ID, models.RolePassenger); err == nil && activeTrip != nil {
			JSONError(w, http.StatusConflict, "ACTIVE_TRIP_EXISTS", "You already have an active ride in progress", nil, reqID)
			return
		}

		now := time.Now().UTC()
		tripID := generateID("trp")
		trip := &models.Trip{
			ID:            tripID,
			PassengerID:   user.ID,
			Status:        models.TripStatusSearching,
			PickupAddress: req.PickupAddress,
			DestAddress:   req.DestAddress,
			PickupLat:     req.PickupLat,
			PickupLng:     req.PickupLng,
			DestLat:       req.DestLat,
			DestLng:       req.DestLng,
			FareMinor:     req.FareMinor,
			Currency:      "KES",
			PaymentStatus: models.PaymentStatusPending,
			CreatedAt:     now,
			UpdatedAt:     now,
		}

		if err := rt.store.CreateTrip(r.Context(), trip); err != nil {
			JSONError(w, http.StatusInternalServerError, "DATABASE_ERROR", err.Error(), nil, reqID)
			return
		}

		// Record initial state event
		_ = rt.store.RecordTripEvent(r.Context(), &models.TripEvent{
			ID:        generateID("ev"),
			TripID:    tripID,
			ActorID:   user.ID,
			ToStatus:  models.TripStatusSearching,
			Metadata:  map[string]any{"pickup": req.PickupAddress, "dest": req.DestAddress},
			CreatedAt: now,
		})

		// Rider Matching Engine: Search for eligible nearby riders within 5km
		lat := req.PickupLat
		lng := req.PickupLng
		if lat == 0 && lng == 0 {
			lat = -1.2673 // Westlands Nairobi reference
			lng = 36.8111
		}

		candidates, err := rt.store.FindNearbyEligibleRiders(r.Context(), lat, lng, 5.0, 5)
		if err == nil && len(candidates) > 0 {
			// Dispatch offer to closest eligible rider
			matchedRider := candidates[0]
			offerID := generateID("ofr")
			offer := &models.TripOffer{
				ID:        offerID,
				TripID:    tripID,
				RiderID:   matchedRider.UserID,
				Status:    models.OfferStatusDispatched,
				ExpiresAt: now.Add(35 * time.Second),
				CreatedAt: now,
			}
			_ = rt.store.CreateTripOffer(r.Context(), offer)

			// Notify matched rider in real-time
			rt.hub.BroadcastToUser(matchedRider.UserID, "trip_offer", map[string]any{
				"offer_id":       offerID,
				"trip_id":        tripID,
				"pickup_address": trip.PickupAddress,
				"dest_address":   trip.DestAddress,
				"fare_minor":     trip.FareMinor,
				"fare_display":   fmt.Sprintf("KSh %.2f", float64(trip.FareMinor)/100.0),
				"expires_in_sec": 30,
			})
		} else {
			// No riders found nearby
			_ = rt.store.UpdateTripStatus(r.Context(), tripID, models.TripStatusNoRiderAvail, "system", nil)
			trip.Status = models.TripStatusNoRiderAvail
		}

		JSON(w, http.StatusCreated, trip, reqID)
		return
	}

	// GET: List trips
	passengerID := ""
	riderID := ""
	for _, r := range user.Roles {
		if r == models.RolePassenger {
			passengerID = user.ID
		}
		if r == models.RoleRider {
			riderID = user.ID
		}
	}

	trips, err := rt.store.ListTrips(r.Context(), passengerID, riderID, "")
	if err != nil {
		JSONError(w, http.StatusInternalServerError, "DATABASE_ERROR", err.Error(), nil, reqID)
		return
	}
	JSON(w, http.StatusOK, trips, reqID)
}

func (rt *Router) handleActiveTrip(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	user := GetUserFromContext(r)

	role := models.RolePassenger
	for _, r := range user.Roles {
		if r == models.RoleRider {
			role = models.RoleRider
			break
		}
	}

	trip, err := rt.store.GetActiveTripForUser(r.Context(), user.ID, role)
	if err != nil || trip == nil {
		JSON(w, http.StatusOK, nil, reqID)
		return
	}
	JSON(w, http.StatusOK, trip, reqID)
}

func (rt *Router) handleTripSubRoutes(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	user := GetUserFromContext(r)
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/trips/")
	parts := strings.Split(path, "/")

	if len(parts) == 0 || parts[0] == "" {
		JSONError(w, http.StatusNotFound, "NOT_FOUND", "Trip ID required", nil, reqID)
		return
	}

	tripID := parts[0]

	// GET /api/v1/trips/{id}
	if len(parts) == 1 && r.Method == http.MethodGet {
		trip, err := rt.store.GetTripByID(r.Context(), tripID)
		if err != nil {
			JSONError(w, http.StatusNotFound, "NOT_FOUND", "Trip not found", nil, reqID)
			return
		}
		JSON(w, http.StatusOK, trip, reqID)
		return
	}

	// POST /api/v1/trips/{id}/offers/accept or /api/v1/trips/{id}/accept
	if ((len(parts) == 3 && parts[1] == "offers" && parts[2] == "accept") || (len(parts) == 2 && parts[1] == "accept")) && r.Method == http.MethodPost {
		// Atomic assignment: Only the first rider can accept!
		err := rt.store.AssignTripToRider(r.Context(), tripID, user.ID)
		if err != nil {
			if err == store.ErrTripAlreadyAssigned {
				JSONError(w, http.StatusConflict, "TRIP_ALREADY_ASSIGNED", "This ride has already been accepted by another operator", nil, reqID)
				return
			}
			JSONError(w, http.StatusInternalServerError, "ASSIGNMENT_ERROR", err.Error(), nil, reqID)
			return
		}

		// Update offer status
		if offer, err := rt.store.GetActiveOfferForRider(r.Context(), user.ID); err == nil && offer != nil {
			_ = rt.store.UpdateOfferStatus(r.Context(), offer.ID, models.OfferStatusAccepted)
		}

		trip, _ := rt.store.GetTripByID(r.Context(), tripID)

		// Broadcast to passenger that rider has accepted
		rt.hub.BroadcastToUser(trip.PassengerID, "trip_assigned", trip)

		JSON(w, http.StatusOK, trip, reqID)
		return
	}

	// POST /api/v1/trips/{id}/offers/reject or /api/v1/trips/{id}/reject
	if ((len(parts) == 3 && parts[1] == "offers" && parts[2] == "reject") || (len(parts) == 2 && parts[1] == "reject")) && r.Method == http.MethodPost {
		if offer, err := rt.store.GetActiveOfferForRider(r.Context(), user.ID); err == nil && offer != nil {
			_ = rt.store.UpdateOfferStatus(r.Context(), offer.ID, models.OfferStatusRejected)
		}
		JSON(w, http.StatusOK, map[string]string{"message": "Offer rejected"}, reqID)
		return
	}

	// POST or PATCH /api/v1/trips/{id}/status
	if len(parts) == 2 && parts[1] == "status" && (r.Method == http.MethodPost || r.Method == http.MethodPatch) {
		var req struct {
			Status string `json:"status"`
			Reason string `json:"reason,omitempty"`
		}
		_ = json.NewDecoder(r.Body).Decode(&req)

		meta := make(map[string]any)
		if req.Reason != "" {
			meta["reason"] = req.Reason
		}

		err := rt.store.UpdateTripStatus(r.Context(), tripID, req.Status, user.ID, meta)
		if err != nil {
			JSONError(w, http.StatusConflict, "INVALID_STATE_TRANSITION", err.Error(), nil, reqID)
			return
		}

		trip, _ := rt.store.GetTripByID(r.Context(), tripID)

		// Broadcast real-time status update to both passenger and rider
		rt.hub.BroadcastToUser(trip.PassengerID, "trip_status_updated", trip)
		if trip.RiderID != nil {
			rt.hub.BroadcastToUser(*trip.RiderID, "trip_status_updated", trip)
		}

		JSON(w, http.StatusOK, trip, reqID)
		return
	}

	// POST /api/v1/trips/{id}/payment
	if len(parts) == 2 && parts[1] == "payment" && r.Method == http.MethodPost {
		trip, err := rt.store.GetTripByID(r.Context(), tripID)
		if err != nil {
			JSONError(w, http.StatusNotFound, "NOT_FOUND", "Trip not found", nil, reqID)
			return
		}
		trip.PaymentStatus = models.PaymentStatusConfirmed
		_ = rt.store.RecordTripEvent(r.Context(), &models.TripEvent{
			ID:        generateID("ev"),
			TripID:    tripID,
			ActorID:   user.ID,
			ToStatus:  "payment_confirmed",
			Metadata:  map[string]any{"amount": trip.FareMinor, "currency": trip.Currency, "method": "cash"},
			CreatedAt: time.Now().UTC(),
		})

		JSON(w, http.StatusOK, map[string]string{
			"payment_status": models.PaymentStatusConfirmed,
			"message":        "Cash payment confirmed by operator",
		}, reqID)
		return
	}

	JSONError(w, http.StatusNotFound, "NOT_FOUND", "Endpoint not found", nil, reqID)
}

// -----------------------------------------------------------------------------
// Rider Operations
// -----------------------------------------------------------------------------

func (rt *Router) handleRiderPresence(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	user := GetUserFromContext(r)

	if r.Method != http.MethodPost {
		JSONError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "POST required", nil, reqID)
		return
	}

	var req struct {
		IsOnline bool `json:"is_online"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	// If going online, validate eligibility gates (verification, account active, subscription)
	if req.IsOnline {
		profile, err := rt.store.GetRiderProfile(r.Context(), user.ID)
		if err != nil || profile.VerificationStatus != models.VerificationApproved {
			JSONError(w, http.StatusForbidden, "RIDER_NOT_VERIFIED", "Operator account must be verified by an administrator before going online", nil, reqID)
			return
		}
		if profile.AccountStatus != models.UserStatusActive {
			JSONError(w, http.StatusForbidden, "ACCOUNT_SUSPENDED", "Operator account is suspended", nil, reqID)
			return
		}
		sub, err := rt.store.GetRiderSubscription(r.Context(), user.ID)
		if err != nil || (sub.Status != models.SubStatusActive && sub.Status != models.SubStatusTrial) || time.Now().UTC().After(sub.ExpiresAt) {
			JSONError(w, http.StatusForbidden, "SUBSCRIPTION_REQUIRED", "An active subscription or trial is required to accept rides", nil, reqID)
			return
		}
	}

	_ = rt.store.SetRiderPresence(r.Context(), user.ID, req.IsOnline)
	presence, _ := rt.store.GetRiderPresence(r.Context(), user.ID)
	JSON(w, http.StatusOK, presence, reqID)
}

func (rt *Router) handleRiderLocation(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	user := GetUserFromContext(r)

	var req struct {
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
		Heading   float64 `json:"heading"`
		SpeedKmh  float64 `json:"speed_kmh"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	loc := &models.RiderLocation{
		RiderID: user.ID,
		Location: models.Coordinates{
			Latitude:  req.Latitude,
			Longitude: req.Longitude,
		},
		Heading:    req.Heading,
		SpeedKmh:   req.SpeedKmh,
		RecordedAt: time.Now().UTC(),
	}
	_ = rt.store.UpdateRiderLocation(r.Context(), loc)

	// If rider has an active trip, broadcast updated coordinates to passenger
	if activeTrip, err := rt.store.GetActiveTripForUser(r.Context(), user.ID, models.RoleRider); err == nil && activeTrip != nil {
		rt.hub.BroadcastToUser(activeTrip.PassengerID, "rider_location_updated", map[string]any{
			"trip_id":   activeTrip.ID,
			"latitude":  req.Latitude,
			"longitude": req.Longitude,
			"heading":   req.Heading,
		})
	}

	JSON(w, http.StatusOK, map[string]string{"status": "recorded"}, reqID)
}

func (rt *Router) handleRiderActiveOffer(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	user := GetUserFromContext(r)

	offer, err := rt.store.GetActiveOfferForRider(r.Context(), user.ID)
	if err != nil || offer == nil {
		JSON(w, http.StatusOK, nil, reqID)
		return
	}
	JSON(w, http.StatusOK, offer, reqID)
}

func (rt *Router) handleRiderEarnings(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	user := GetUserFromContext(r)

	trips, _ := rt.store.ListTrips(r.Context(), "", user.ID, models.TripStatusCompleted)

	now := time.Now().UTC()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	weekStart := todayStart.AddDate(0, 0, -7)
	monthStart := todayStart.AddDate(0, -1, 0)

	var todayCashMinor, weekCashMinor, monthCashMinor int64

	for _, t := range trips {
		if t.CreatedAt.After(todayStart) {
			todayCashMinor += t.FareMinor
		}
		if t.CreatedAt.After(weekStart) {
			weekCashMinor += t.FareMinor
		}
		if t.CreatedAt.After(monthStart) {
			monthCashMinor += t.FareMinor
		}
	}

	JSON(w, http.StatusOK, map[string]any{
		"currency":                 "KES",
		"commission_rate":          "0%", // 100% retained by operator
		"platform_deduction_minor": 0,
		"completed_trips":          len(trips),
		"today_cash_minor":     todayCashMinor,
		"today_cash_display":   fmt.Sprintf("KSh %.2f", float64(todayCashMinor)/100.0),
		"weekly_cash_minor":    weekCashMinor,
		"weekly_cash_display":  fmt.Sprintf("KSh %.2f", float64(weekCashMinor)/100.0),
		"monthly_cash_minor":   monthCashMinor,
		"monthly_cash_display": fmt.Sprintf("KSh %.2f", float64(monthCashMinor)/100.0),
	}, reqID)
}

func (rt *Router) handleRiderSubscription(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	user := GetUserFromContext(r)

	sub, _ := rt.store.GetRiderSubscription(r.Context(), user.ID)
	plans, _ := rt.store.ListSubscriptionPlans(r.Context(), true)

	JSON(w, http.StatusOK, map[string]any{
		"current_subscription": sub,
		"available_plans":      plans,
	}, reqID)
}

func (rt *Router) handleRiderMotorbike(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	user := GetUserFromContext(r)

	if r.Method == http.MethodGet {
		mb, err := rt.store.GetMotorbikeByRiderID(r.Context(), user.ID)
		if err != nil {
			JSONError(w, http.StatusNotFound, "NOT_FOUND", "No motorbike registered", nil, reqID)
			return
		}
		JSON(w, http.StatusOK, mb, reqID)
		return
	}

	var req struct {
		PlateNumber string `json:"plate_number"`
		Model       string `json:"model"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	mb := &models.Motorbike{
		ID:             generateID("mb"),
		RiderID:        user.ID,
		PlateNumber:    req.PlateNumber,
		Model:          req.Model,
		HelmetIncluded: true,
		Status:         models.VerificationPending,
		CreatedAt:      time.Now().UTC(),
	}
	_ = rt.store.CreateMotorbike(r.Context(), mb)
	JSON(w, http.StatusOK, mb, reqID)
}

func (rt *Router) handleRiderDocuments(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	user := GetUserFromContext(r)

	if r.Method == http.MethodGet {
		docs, _ := rt.store.GetVerificationDocuments(r.Context(), user.ID)
		JSON(w, http.StatusOK, docs, reqID)
		return
	}

	var req struct {
		DocType string `json:"doc_type"`
		FileURL string `json:"file_url"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	doc := &models.VerificationDocument{
		ID:        generateID("doc"),
		RiderID:   user.ID,
		DocType:   req.DocType,
		FileURL:   req.FileURL,
		Status:    "pending",
		CreatedAt: time.Now().UTC(),
	}
	_ = rt.store.AddVerificationDocument(r.Context(), doc)
	JSON(w, http.StatusCreated, doc, reqID)
}

func (rt *Router) handlePassengerProfile(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	user := GetUserFromContext(r)

	if r.Method == http.MethodPatch {
		var req struct {
			DisplayName string `json:"display_name"`
		}
		_ = json.NewDecoder(r.Body).Decode(&req)

		p, err := rt.store.GetPassengerProfile(r.Context(), user.ID)
		if err == nil {
			p.DisplayName = req.DisplayName
			_ = rt.store.UpdatePassengerProfile(r.Context(), p)
		}
		JSON(w, http.StatusOK, p, reqID)
		return
	}

	p, err := rt.store.GetPassengerProfile(r.Context(), user.ID)
	if err != nil {
		JSONError(w, http.StatusNotFound, "NOT_FOUND", "Profile not found", nil, reqID)
		return
	}
	JSON(w, http.StatusOK, p, reqID)
}

// -----------------------------------------------------------------------------
// Safety & SOS
// -----------------------------------------------------------------------------

func (rt *Router) handleSafetyReport(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	user := GetUserFromContext(r)

	if r.Method != http.MethodPost {
		JSONError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "POST required", nil, reqID)
		return
	}

	var req struct {
		TripID      *string `json:"trip_id,omitempty"`
		Category    string  `json:"category"`
		Description string  `json:"description"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	now := time.Now().UTC()
	rep := &models.SafetyReport{
		ID:          generateID("rep"),
		TripID:      req.TripID,
		ReporterID:  user.ID,
		Category:    req.Category,
		Description: req.Description,
		Status:      "open",
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	_ = rt.store.CreateSafetyReport(r.Context(), rep)

	// Broadcast alert to admin
	rt.hub.BroadcastEvent("safety_alert", rep)

	JSON(w, http.StatusCreated, rep, reqID)
}

// -----------------------------------------------------------------------------
// Administrator Endpoints (STRICT ADMIN SEPARATION)
// -----------------------------------------------------------------------------

func (rt *Router) handleAdminOverview(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	metrics, err := rt.store.GetAdminMetrics(r.Context())
	if err != nil {
		JSONError(w, http.StatusInternalServerError, "DATABASE_ERROR", err.Error(), nil, reqID)
		return
	}
	JSON(w, http.StatusOK, metrics, reqID)
}

func (rt *Router) handleAdminPassengers(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	users, _ := rt.store.ListUsers(r.Context(), models.RolePassenger, "")

	type PassengerItem struct {
		ID        string    `json:"id"`
		Phone     string    `json:"phone"`
		Name      string    `json:"name"`
		Status    string    `json:"status"`
		CreatedAt time.Time `json:"created_at"`
	}
	res := make([]PassengerItem, 0, len(users))
	for _, u := range users {
		name := "Passenger"
		if p, err := rt.store.GetPassengerProfile(r.Context(), u.ID); err == nil {
			name = p.DisplayName
		}
		res = append(res, PassengerItem{
			ID:        u.ID,
			Phone:     u.PhoneE164,
			Name:      name,
			Status:    u.Status,
			CreatedAt: u.CreatedAt,
		})
	}
	JSON(w, http.StatusOK, res, reqID)
}

func (rt *Router) handleAdminUserStatus(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	user := GetUserFromContext(r)
	userID := strings.TrimPrefix(r.URL.Path, "/api/v1/admin/users/")
	userID = strings.TrimSuffix(userID, "/status")

	var req struct {
		Status string `json:"status"`
		Reason string `json:"reason,omitempty"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	if req.Status != models.UserStatusActive && req.Status != models.UserStatusSuspended {
		JSONError(w, http.StatusBadRequest, "BAD_REQUEST", "Status must be active or suspended", nil, reqID)
		return
	}

	_ = rt.store.UpdateUserStatus(r.Context(), userID, req.Status)
	_ = rt.store.RecordAuditLog(r.Context(), &models.AuditLog{
		ID:         generateID("aud"),
		ActorID:    user.ID,
		Action:     "UPDATE_USER_STATUS",
		TargetType: "user",
		TargetID:   userID,
		Details:    map[string]any{"new_status": req.Status, "reason": req.Reason},
		CreatedAt:  time.Now().UTC(),
	})

	JSON(w, http.StatusOK, map[string]string{"status": req.Status}, reqID)
}

func (rt *Router) handleAdminRiders(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	statusFilter := r.URL.Query().Get("status")

	riders, _ := rt.store.ListRiders(r.Context(), statusFilter)

	type RiderAdminItem struct {
		*models.RiderProfile
		Phone        string                         `json:"phone"`
		Motorbike    *models.Motorbike              `json:"motorbike,omitempty"`
		Documents    []*models.VerificationDocument `json:"documents,omitempty"`
		Subscription *models.RiderSubscription      `json:"subscription,omitempty"`
		IsOnline     bool                           `json:"is_online"`
	}

	res := make([]RiderAdminItem, 0, len(riders))
	for _, rProf := range riders {
		item := RiderAdminItem{RiderProfile: rProf}
		if u, err := rt.store.GetUserByID(r.Context(), rProf.UserID); err == nil {
			item.Phone = u.PhoneE164
		}
		if mb, err := rt.store.GetMotorbikeByRiderID(r.Context(), rProf.UserID); err == nil {
			item.Motorbike = mb
		}
		if docs, err := rt.store.GetVerificationDocuments(r.Context(), rProf.UserID); err == nil {
			item.Documents = docs
		}
		if sub, err := rt.store.GetRiderSubscription(r.Context(), rProf.UserID); err == nil {
			item.Subscription = sub
		}
		if pres, err := rt.store.GetRiderPresence(r.Context(), rProf.UserID); err == nil {
			item.IsOnline = pres.IsOnline
		}
		res = append(res, item)
	}

	JSON(w, http.StatusOK, res, reqID)
}

func (rt *Router) handleAdminRiderReview(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	user := GetUserFromContext(r)
	riderID := strings.TrimPrefix(r.URL.Path, "/api/v1/admin/riders/")
	riderID = strings.TrimSuffix(riderID, "/review")

	var req struct {
		Decision string `json:"decision"` // approved, rejected, needs_info
		Notes    string `json:"notes"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	rev := &models.VerificationReview{
		ID:         generateID("rev"),
		RiderID:    riderID,
		ReviewerID: user.ID,
		Decision:   req.Decision,
		Notes:      req.Notes,
		CreatedAt:  time.Now().UTC(),
	}
	_ = rt.store.AddVerificationReview(r.Context(), rev)

	_ = rt.store.RecordAuditLog(r.Context(), &models.AuditLog{
		ID:         generateID("aud"),
		ActorID:    user.ID,
		Action:     "REVIEW_RIDER_VERIFICATION",
		TargetType: "rider",
		TargetID:   riderID,
		Details:    map[string]any{"decision": req.Decision, "notes": req.Notes},
		CreatedAt:  time.Now().UTC(),
	})

	JSON(w, http.StatusOK, rev, reqID)
}

func (rt *Router) handleAdminTrips(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	status := r.URL.Query().Get("status")
	trips, _ := rt.store.ListTrips(r.Context(), "", "", status)
	JSON(w, http.StatusOK, trips, reqID)
}

func (rt *Router) handleAdminPricing(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	user := GetUserFromContext(r)

	if r.Method == http.MethodPost {
		var req struct {
			BaseFareMinor int64 `json:"base_fare_minor"`
			PerKmMinor    int64 `json:"per_km_minor"`
			PerMinMinor   int64 `json:"per_min_minor"`
			MinFareMinor  int64 `json:"min_fare_minor"`
		}
		_ = json.NewDecoder(r.Body).Decode(&req)

		rule := &models.PricingRule{
			ID:            generateID("pr"),
			Currency:      "KES",
			BaseFareMinor: req.BaseFareMinor,
			PerKmMinor:    req.PerKmMinor,
			PerMinMinor:   req.PerMinMinor,
			MinFareMinor:  req.MinFareMinor,
			Version:       int(time.Now().Unix()),
			Active:        true,
			CreatedAt:     time.Now().UTC(),
		}
		_ = rt.store.CreatePricingRule(r.Context(), rule)

		_ = rt.store.RecordAuditLog(r.Context(), &models.AuditLog{
			ID:         generateID("aud"),
			ActorID:    user.ID,
			Action:     "UPDATE_PRICING_RULE",
			TargetType: "pricing_rule",
			TargetID:   rule.ID,
			Details:    map[string]any{"base": req.BaseFareMinor, "per_km": req.PerKmMinor, "min": req.MinFareMinor},
			CreatedAt:  time.Now().UTC(),
		})

		JSON(w, http.StatusCreated, rule, reqID)
		return
	}

	rules, _ := rt.store.ListPricingRules(r.Context())
	JSON(w, http.StatusOK, rules, reqID)
}

func (rt *Router) handleAdminSubscriptions(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	plans, _ := rt.store.ListSubscriptionPlans(r.Context(), false)
	subs, _ := rt.store.ListRiderSubscriptions(r.Context())

	JSON(w, http.StatusOK, map[string]any{
		"plans":         plans,
		"subscriptions": subs,
	}, reqID)
}

func (rt *Router) handleAdminSubscriptionPlan(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	var req struct {
		Code       string `json:"code"`
		Name       string `json:"name"`
		PriceMinor int64  `json:"price_minor"`
		PeriodDays int    `json:"period_days"`
		TrialDays  int    `json:"trial_days"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	plan := &models.SubscriptionPlan{
		ID:         generateID("plan"),
		Code:       req.Code,
		Name:       req.Name,
		PriceMinor: req.PriceMinor,
		Currency:   "KES",
		PeriodDays: req.PeriodDays,
		TrialDays:  req.TrialDays,
		Active:     true,
		CreatedAt:  time.Now().UTC(),
	}
	_ = rt.store.CreateSubscriptionPlan(r.Context(), plan)
	JSON(w, http.StatusCreated, plan, reqID)
}

func (rt *Router) handleAdminGrantSubscription(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	user := GetUserFromContext(r)

	var req struct {
		RiderID   string `json:"rider_id"`
		PlanID    string `json:"plan_id"`
		DaysValid int    `json:"days_valid"`
		Reason    string `json:"reason"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	days := req.DaysValid
	if days <= 0 {
		days = 30
	}

	now := time.Now().UTC()
	sub := &models.RiderSubscription{
		ID:        generateID("sub"),
		RiderID:   req.RiderID,
		PlanID:    req.PlanID,
		Status:    models.SubStatusActive,
		StartsAt:  now,
		ExpiresAt: now.Add(time.Duration(days) * 24 * time.Hour),
		CreatedAt: now,
	}
	_ = rt.store.UpsertRiderSubscription(r.Context(), sub)

	_ = rt.store.RecordAuditLog(r.Context(), &models.AuditLog{
		ID:         generateID("aud"),
		ActorID:    user.ID,
		Action:     "MANUAL_GRANT_SUBSCRIPTION",
		TargetType: "rider_subscription",
		TargetID:   sub.ID,
		Details:    map[string]any{"rider_id": req.RiderID, "reason": req.Reason, "days": days},
		CreatedAt:  now,
	})

	JSON(w, http.StatusOK, sub, reqID)
}

func (rt *Router) handleAdminSafetyList(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	reports, _ := rt.store.ListSafetyReports(r.Context(), "")
	JSON(w, http.StatusOK, reports, reqID)
}

func (rt *Router) handleAdminSafetyStatus(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	reportID := strings.TrimPrefix(r.URL.Path, "/api/v1/admin/safety/")

	var req struct {
		Status string `json:"status"` // open, investigating, resolved, dismissed
		Notes  string `json:"notes"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	_ = rt.store.UpdateSafetyReportStatus(r.Context(), reportID, req.Status, req.Notes)
	rep, _ := rt.store.GetSafetyReportByID(r.Context(), reportID)
	JSON(w, http.StatusOK, rep, reqID)
}

func (rt *Router) handleAdminAdministrators(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	currentUser := GetUserFromContext(r)

	if r.Method == http.MethodPost {
		var req struct {
			Phone    string `json:"phone"`
			Password string `json:"password"`
			FullName string `json:"full_name"`
			Role     string `json:"role"`
		}
		_ = json.NewDecoder(r.Body).Decode(&req)

		phone := strings.TrimSpace(req.Phone)
		if !strings.HasPrefix(phone, "+") {
			if strings.HasPrefix(phone, "0") {
				phone = "+254" + phone[1:]
			}
		}

		pwdHash, _ := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		now := time.Now().UTC()
		adminRole := models.RoleAdmin
		if req.Role == models.RoleSuperAdmin {
			adminRole = models.RoleSuperAdmin
		}

		newAdmin := &models.User{
			ID:              generateID("usr_adm"),
			PhoneE164:       phone,
			PhoneVerifiedAt: &now,
			Status:          models.UserStatusActive,
			Roles:           []string{adminRole},
			CreatedAt:       now,
			UpdatedAt:       now,
		}
		_ = rt.store.CreateUser(r.Context(), newAdmin, string(pwdHash))

		_ = rt.store.RecordAuditLog(r.Context(), &models.AuditLog{
			ID:         generateID("aud"),
			ActorID:    currentUser.ID,
			Action:     "PROVISION_ADMINISTRATOR",
			TargetType: "user",
			TargetID:   newAdmin.ID,
			Details:    map[string]any{"phone": newAdmin.PhoneE164, "role": adminRole},
			CreatedAt:  now,
		})

		JSON(w, http.StatusCreated, newAdmin, reqID)
		return
	}

	admins, _ := rt.store.ListUsers(r.Context(), models.RoleAdmin, "")
	JSON(w, http.StatusOK, admins, reqID)
}

func (rt *Router) handleAdminAuditLogs(w http.ResponseWriter, r *http.Request) {
	reqID := GetRequestID(r)
	logs, _ := rt.store.ListAuditLogs(r.Context(), 50)
	JSON(w, http.StatusOK, logs, reqID)
}

// -----------------------------------------------------------------------------
// Real-Time WebSocket Handler
// -----------------------------------------------------------------------------

func (rt *Router) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromContext(r)
	userID := "anonymous"
	role := "guest"
	if user != nil {
		userID = user.ID
		if len(user.Roles) > 0 {
			role = user.Roles[0]
		}
	}
	appws.ServeWs(rt.hub, w, r, userID, role)
}
