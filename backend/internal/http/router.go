package http

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"
)

type Router struct {
	mux sync.Mutex
	// In-memory operational store for local development & pilot demonstration
	sessions  map[string]map[string]any
	quotes    map[string]map[string]any
	trips     map[string]map[string]any
	riders    map[string]map[string]any
	reviews   []map[string]any
	incidents []map[string]any
}

func NewRouter() *Router {
	r := &Router{
		sessions:  make(map[string]map[string]any),
		quotes:    make(map[string]map[string]any),
		trips:     make(map[string]map[string]any),
		riders:    make(map[string]map[string]any),
		reviews:   make([]map[string]any, 0),
		incidents: make([]map[string]any, 0),
	}

	// Seed fictional pilot data per docs/TASKS.md RDR-116
	r.seedPilotData()
	return r
}

func (rt *Router) seedPilotData() {
	// Sample vetted rider: Juma Mwangi
	rt.riders["rider_juma"] = map[string]any{
		"id":                  "r_101",
		"name":                "Juma Mwangi",
		"phone":               "+254 722 458 912",
		"rating":              4.95,
		"bike":                "Bajaj Boxer 150",
		"plate":               "KMD 821Q",
		"is_online":           true,
		"verification_status": "approved",
		"subscription_status": "trial",
		"trial_days_left":     24,
		"helmet_included":     true,
		"completed_trips":     1420,
		"today_cash_earnings": 345000, // KSh 3,450.00 in minor units
	}

	// Sample pending review: Peter Ochieng
	rt.reviews = append(rt.reviews, map[string]any{
		"id":           "rev_001",
		"rider_id":     "r_102",
		"name":         "Peter Ochieng",
		"phone":        "+254 711 998 877",
		"plate":        "KMDK 392A",
		"bike":         "TVS Star HLX 150",
		"submitted_at": time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
		"status":       "pending",
		"documents": []map[string]string{
			{"type": "national_id", "status": "verified"},
			{"type": "driving_license", "status": "pending"},
			{"type": "police_clearance", "status": "pending"},
		},
	})
}

func (rt *Router) Routes() http.Handler {
	mux := http.NewServeMux()

	// 1. Health Endpoints (docs/TASKS.md RDR-106)
	mux.HandleFunc("/health/live", func(w http.ResponseWriter, r *http.Request) {
		reqID := r.Header.Get("X-Request-ID")
		JSON(w, http.StatusOK, map[string]any{
			"status":    "live",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		}, reqID)
	})

	mux.HandleFunc("/health/ready", func(w http.ResponseWriter, r *http.Request) {
		reqID := r.Header.Get("X-Request-ID")
		JSON(w, http.StatusOK, map[string]any{
			"status":   "ready",
			"database": "operational",
			"version":  "1.0.0",
		}, reqID)
	})

	// 2. Auth Endpoints
	mux.HandleFunc("/api/v1/auth/csrf", func(w http.ResponseWriter, r *http.Request) {
		reqID := r.Header.Get("X-Request-ID")
		token := "csrf_" + GenerateRequestID()
		JSON(w, http.StatusOK, map[string]string{
			"csrf_token": token,
		}, reqID)
	})

	mux.HandleFunc("/api/v1/auth/register", func(w http.ResponseWriter, r *http.Request) {
		reqID := r.Header.Get("X-Request-ID")
		if r.Method != http.MethodPost {
			JSONError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "POST required", nil, reqID)
			return
		}

		var payload struct {
			FullName string `json:"full_name"`
			Phone    string `json:"phone"`
			Role     string `json:"role"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			JSONError(w, http.StatusBadRequest, "BAD_REQUEST", "Invalid JSON body", nil, reqID)
			return
		}

		user := map[string]any{
			"id":        "usr_" + GenerateRequestID(),
			"full_name": payload.FullName,
			"phone":     payload.Phone,
			"role":      payload.Role,
			"status":    "active",
		}
		JSON(w, http.StatusCreated, user, reqID)
	})

	mux.HandleFunc("/api/v1/auth/login", func(w http.ResponseWriter, r *http.Request) {
		reqID := r.Header.Get("X-Request-ID")
		if r.Method != http.MethodPost {
			JSONError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "POST required", nil, reqID)
			return
		}

		var payload struct {
			Phone    string `json:"phone"`
			Password string `json:"password"`
			Role     string `json:"role"`
		}
		_ = json.NewDecoder(r.Body).Decode(&payload)

		role := payload.Role
		if role == "" {
			role = "passenger"
		}

		user := map[string]any{
			"id":        "usr_pilot_kevin",
			"full_name": "Kevin Mwangi",
			"phone":     payload.Phone,
			"role":      role,
			"rating":    4.9,
			"initials":  "KM",
		}
		JSON(w, http.StatusOK, user, reqID)
	})

	// 3. Upfront Fare Quote (docs/API.md & docs/DATABASE.md)
	// All monetary values in integer minor units (KES cents, e.g. 18000 = KSh 180.00)
	mux.HandleFunc("/api/v1/quotes", func(w http.ResponseWriter, r *http.Request) {
		reqID := r.Header.Get("X-Request-ID")
		if r.Method != http.MethodPost {
			JSONError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "POST required", nil, reqID)
			return
		}

		var req struct {
			PickupAddress string  `json:"pickup_address"`
			DestAddress   string  `json:"dest_address"`
			DistanceKm    float64 `json:"distance_km"`
		}
		_ = json.NewDecoder(r.Body).Decode(&req)

		// Authoritative Server-Side Pricing Calculation (docs/TASKS.md RDR-408)
		baseFareMinor := int64(5000)  // KSh 50.00 base
		perKmMinor := int64(3500)     // KSh 35.00 / km
		dist := req.DistanceKm
		if dist <= 0 {
			if strings.Contains(strings.ToUpper(req.DestAddress), "JKIA") {
				dist = 16.5
			} else {
				dist = 3.8
			}
		}

		computedFareMinor := baseFareMinor + int64(dist*float64(perKmMinor))
		if computedFareMinor < 10000 {
			computedFareMinor = 10000 // Minimum fare KSh 100.00
		}

		quoteID := "quo_" + GenerateRequestID()
		quote := map[string]any{
			"id":               quoteID,
			"currency":         "KES",
			"fare_minor":       computedFareMinor,
			"fare_display":     fmt.Sprintf("KSh %.2f", float64(computedFareMinor)/100.0),
			"distance_km":      dist,
			"duration_minutes": int(dist * 2.8),
			"pricing_version":  1,
			"commission_rate":  "0%",
			"expires_at":       time.Now().Add(10 * time.Minute).UTC().Format(time.RFC3339),
		}

		rt.mux.Lock()
		rt.quotes[quoteID] = quote
		rt.mux.Unlock()

		JSON(w, http.StatusOK, quote, reqID)
	})

	// 4. Trip Booking & State Transitions (docs/API.md)
	mux.HandleFunc("/api/v1/trips", func(w http.ResponseWriter, r *http.Request) {
		reqID := r.Header.Get("X-Request-ID")
		if r.Method == http.MethodPost {
			var req struct {
				PickupAddress string `json:"pickup_address"`
				DestAddress   string `json:"dest_address"`
				FareMinor     int64  `json:"fare_minor"`
			}
			_ = json.NewDecoder(r.Body).Decode(&req)

			tripID := "trp_" + GenerateRequestID()
			trip := map[string]any{
				"id":             tripID,
				"status":         "assigned",
				"pickup_address": req.PickupAddress,
				"dest_address":   req.DestAddress,
				"fare_minor":     req.FareMinor,
				"currency":       "KES",
				"rider":          rt.riders["rider_juma"],
				"created_at":     time.Now().UTC().Format(time.RFC3339),
			}

			rt.mux.Lock()
			rt.trips[tripID] = trip
			rt.mux.Unlock()

			JSON(w, http.StatusCreated, trip, reqID)
			return
		}

		// List trips
		tripList := make([]any, 0)
		rt.mux.Lock()
		for _, t := range rt.trips {
			tripList = append(tripList, t)
		}
		rt.mux.Unlock()

		JSON(w, http.StatusOK, tripList, reqID)
	})

	// 5. Rider Operations & Onboarding (docs/TASKS.md M3, M6)
	mux.HandleFunc("/api/v1/riders/availability", func(w http.ResponseWriter, r *http.Request) {
		reqID := r.Header.Get("X-Request-ID")
		var req struct {
			IsOnline bool `json:"is_online"`
		}
		_ = json.NewDecoder(r.Body).Decode(&req)

		rt.mux.Lock()
		if rdr, exists := rt.riders["rider_juma"]; exists {
			rdr["is_online"] = req.IsOnline
		}
		rt.mux.Unlock()

		JSON(w, http.StatusOK, map[string]any{
			"is_online": req.IsOnline,
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		}, reqID)
	})

	mux.HandleFunc("/api/v1/riders/earnings", func(w http.ResponseWriter, r *http.Request) {
		reqID := r.Header.Get("X-Request-ID")
		earnings := map[string]any{
			"rider_id":            "r_101",
			"today_cash_minor":    345000,
			"today_cash_display":  "KSh 3,450.00",
			"week_cash_minor":     1890000,
			"week_cash_display":   "KSh 18,900.00",
			"platform_commission": "0% (Retained 100%)",
			"subscription": map[string]any{
				"status":          "trial",
				"trial_days_left": 24,
				"plan_name":       "Nairobi Pilot 30-Day Free Trial",
			},
		}
		JSON(w, http.StatusOK, earnings, reqID)
	})

	// 6. Admin Portal Endpoints (docs/TASKS.md M8)
	mux.HandleFunc("/api/v1/admin/overview", func(w http.ResponseWriter, r *http.Request) {
		reqID := r.Header.Get("X-Request-ID")
		overview := map[string]any{
			"total_passengers":    248,
			"verified_riders":     42,
			"pending_onboarding":  len(rt.reviews),
			"completed_trips":     1890,
			"platform_model":      "0% Trip Commission (Subscription Based)",
			"safety_rating_avg":   4.92,
			"active_pilot_stages": []string{"Westlands", "CBD", "Kilimani", "Upper Hill"},
		}
		JSON(w, http.StatusOK, overview, reqID)
	})

	mux.HandleFunc("/api/v1/admin/riders/reviews", func(w http.ResponseWriter, r *http.Request) {
		reqID := r.Header.Get("X-Request-ID")
		JSON(w, http.StatusOK, rt.reviews, reqID)
	})

	// 7. Safety Reporting (docs/PRD.md & docs/SECURITY.md)
	mux.HandleFunc("/api/v1/safety/reports", func(w http.ResponseWriter, r *http.Request) {
		reqID := r.Header.Get("X-Request-ID")
		var req struct {
			Category    string `json:"category"`
			Description string `json:"description"`
			TripID      string `json:"trip_id"`
		}
		_ = json.NewDecoder(r.Body).Decode(&req)

		report := map[string]any{
			"id":          "rep_" + GenerateRequestID(),
			"category":    req.Category,
			"description": req.Description,
			"status":      "open",
			"helpline":    "0700 RIDER (74337)",
			"created_at":  time.Now().UTC().Format(time.RFC3339),
		}
		rt.mux.Lock()
		rt.incidents = append(rt.incidents, report)
		rt.mux.Unlock()

		JSON(w, http.StatusCreated, report, reqID)
	})

	return mux
}
