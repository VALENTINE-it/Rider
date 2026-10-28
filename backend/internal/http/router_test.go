package http

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/VALENTINE-it/Rider/backend/internal/models"
	"github.com/VALENTINE-it/Rider/backend/internal/store"
	appws "github.com/VALENTINE-it/Rider/backend/internal/websocket"
)

func setupTestApp() (*Router, store.Store, *appws.Hub, http.Handler) {
	s := store.NewMemoryStore()
	hub := appws.NewHub()
	router := NewRouter(s, hub)
	handler := Middleware("http://localhost:5173", s, router.Routes())
	return router, s, hub, handler
}

func TestHealthEndpoints(t *testing.T) {
	_, _, _, handler := setupTestApp()

	// 1. Live
	recLive := httptest.NewRecorder()
	reqLive := httptest.NewRequest(http.MethodGet, "/health/live", nil)
	handler.ServeHTTP(recLive, reqLive)

	if recLive.Code != http.StatusOK {
		t.Errorf("expected 200 for /health/live, got %d", recLive.Code)
	}

	// 2. Ready
	recReady := httptest.NewRecorder()
	reqReady := httptest.NewRequest(http.MethodGet, "/health/ready", nil)
	handler.ServeHTTP(recReady, reqReady)

	if recReady.Code != http.StatusOK {
		t.Errorf("expected 200 for /health/ready, got %d", recReady.Code)
	}
}

func TestAuth_RegistrationAndCSRF(t *testing.T) {
	_, _, _, handler := setupTestApp()

	// 1. Get CSRF token
	recCSRF := httptest.NewRecorder()
	reqCSRF := httptest.NewRequest(http.MethodGet, "/api/v1/auth/csrf", nil)
	handler.ServeHTTP(recCSRF, reqCSRF)

	if recCSRF.Code != http.StatusOK {
		t.Fatalf("expected 200 for csrf, got %d", recCSRF.Code)
	}
	var csrfResp SuccessResponse
	_ = json.NewDecoder(recCSRF.Body).Decode(&csrfResp)
	csrfData := csrfResp.Data.(map[string]any)
	token := csrfData["csrf_token"].(string)

	// 2. Register Passenger
	regBody := map[string]any{
		"full_name": "Amina Mohamed",
		"phone":     "+254722112233",
		"password":  "ValidPass123!",
		"role":      "passenger",
	}
	bodyBytes, _ := json.Marshal(regBody)

	recReg := httptest.NewRecorder()
	reqReg := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader(bodyBytes))
	reqReg.Header.Set("Content-Type", "application/json")
	reqReg.Header.Set("X-CSRF-Token", token)
	handler.ServeHTTP(recReg, reqReg)

	if recReg.Code != http.StatusCreated {
		t.Fatalf("expected 201 for register, got %d: %s", recReg.Code, recReg.Body.String())
	}

	// Check session cookie set
	cookies := recReg.Result().Cookies()
	hasSessionCookie := false
	for _, c := range cookies {
		if c.Name == "rider_session" && c.Value != "" && c.HttpOnly {
			hasSessionCookie = true
			break
		}
	}
	if !hasSessionCookie {
		t.Errorf("expected HttpOnly rider_session cookie to be set")
	}

	// 3. STRICT ADMIN SEPARATION: Prevent public registration as admin!
	adminRegBody := map[string]any{
		"full_name": "Hacker",
		"phone":     "+254722998877",
		"password":  "ValidPass123!",
		"role":      "admin",
	}
	admBytes, _ := json.Marshal(adminRegBody)
	recAdm := httptest.NewRecorder()
	reqAdm := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader(admBytes))
	reqAdm.Header.Set("Content-Type", "application/json")
	reqAdm.Header.Set("X-CSRF-Token", token)
	handler.ServeHTTP(recAdm, reqAdm)

	if recAdm.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 when attempting public admin registration, got %d", recAdm.Code)
	}
}

func TestAuth_LoginAndStrictAdminSeparation(t *testing.T) {
	_, _, _, handler := setupTestApp()

	// 1. Get CSRF token
	recCSRF := httptest.NewRecorder()
	reqCSRF := httptest.NewRequest(http.MethodGet, "/api/v1/auth/csrf", nil)
	handler.ServeHTTP(recCSRF, reqCSRF)
	var csrfResp SuccessResponse
	_ = json.NewDecoder(recCSRF.Body).Decode(&csrfResp)
	token := csrfResp.Data.(map[string]any)["csrf_token"].(string)

	// 2. Passenger login via regular login
	loginBody := map[string]any{
		"phone":    "+254712345678",
		"password": "Pass1234!",
	}
	bBytes, _ := json.Marshal(loginBody)
	recLogin := httptest.NewRecorder()
	reqLogin := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(bBytes))
	reqLogin.Header.Set("Content-Type", "application/json")
	reqLogin.Header.Set("X-CSRF-Token", token)
	handler.ServeHTTP(recLogin, reqLogin)

	if recLogin.Code != http.StatusOK {
		t.Fatalf("expected 200 for passenger login, got %d: %s", recLogin.Code, recLogin.Body.String())
	}

	// 3. Attempting Admin Login with Passenger credentials MUST FAIL with 403 Forbidden!
	recAdmLogin := httptest.NewRecorder()
	reqAdmLogin := httptest.NewRequest(http.MethodPost, "/api/v1/admin/login", bytes.NewReader(bBytes))
	reqAdmLogin.Header.Set("Content-Type", "application/json")
	reqAdmLogin.Header.Set("X-CSRF-Token", token)
	handler.ServeHTTP(recAdmLogin, reqAdmLogin)

	if recAdmLogin.Code != http.StatusForbidden {
		t.Fatalf("expected 403 Forbidden when passenger attempts admin login, got %d", recAdmLogin.Code)
	}

	// 4. Valid Admin Login with Admin credentials (+254700000001) MUST SUCCEED
	adminCreds := map[string]any{
		"phone":    "+254700000001",
		"password": "Pass1234!",
	}
	aBytes, _ := json.Marshal(adminCreds)
	recRealAdm := httptest.NewRecorder()
	reqRealAdm := httptest.NewRequest(http.MethodPost, "/api/v1/admin/login", bytes.NewReader(aBytes))
	reqRealAdm.Header.Set("Content-Type", "application/json")
	reqRealAdm.Header.Set("X-CSRF-Token", token)
	handler.ServeHTTP(recRealAdm, reqRealAdm)

	if recRealAdm.Code != http.StatusOK {
		t.Fatalf("expected 200 for valid admin login, got %d: %s", recRealAdm.Code, recRealAdm.Body.String())
	}
}

func TestPricingQuoteCalculation(t *testing.T) {
	_, _, _, handler := setupTestApp()

	body := map[string]any{
		"pickup_address": "Westlands",
		"dest_address":   "Nairobi CBD",
		"distance_km":    4.0,
	}
	bodyBytes, _ := json.Marshal(body)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/quotes", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-CSRF-Token", "csrf_test_token")
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 for /api/v1/quotes, got %d", rec.Code)
	}

	var resp SuccessResponse
	_ = json.NewDecoder(rec.Body).Decode(&resp)

	quoteData, ok := resp.Data.(map[string]any)
	if !ok {
		t.Fatalf("expected map[string]any quote data")
	}

	fareMinor, ok := quoteData["fare_minor"].(float64)
	if !ok || fareMinor <= 0 {
		t.Errorf("expected positive fare_minor, got %v", quoteData["fare_minor"])
	}

	// Check 0% commission property
	if quoteData["commission_rate"] != "0%" {
		t.Errorf("expected 0%% commission rate, got %v", quoteData["commission_rate"])
	}
}

func TestAdminAuthorizationProtection(t *testing.T) {
	_, _, _, handler := setupTestApp()

	// 1. Unauthenticated request to admin endpoint must return 401
	recUnauth := httptest.NewRecorder()
	reqUnauth := httptest.NewRequest(http.MethodGet, "/api/v1/admin/overview", nil)
	handler.ServeHTTP(recUnauth, reqUnauth)

	if recUnauth.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for unauthenticated admin access, got %d", recUnauth.Code)
	}

	// 2. Request with Passenger session cookie must return 403 Forbidden
	// Log in as passenger first to get session cookie
	recCSRF := httptest.NewRecorder()
	reqCSRF := httptest.NewRequest(http.MethodGet, "/api/v1/auth/csrf", nil)
	handler.ServeHTTP(recCSRF, reqCSRF)
	var csrfResp SuccessResponse
	_ = json.NewDecoder(recCSRF.Body).Decode(&csrfResp)
	token := csrfResp.Data.(map[string]any)["csrf_token"].(string)

	pLoginBody := map[string]any{
		"phone":    "+254712345678",
		"password": "Pass1234!",
	}
	pBytes, _ := json.Marshal(pLoginBody)
	recPLogin := httptest.NewRecorder()
	reqPLogin := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(pBytes))
	reqPLogin.Header.Set("Content-Type", "application/json")
	reqPLogin.Header.Set("X-CSRF-Token", token)
	handler.ServeHTTP(recPLogin, reqPLogin)

	var pCookie *http.Cookie
	for _, c := range recPLogin.Result().Cookies() {
		if c.Name == "rider_session" {
			pCookie = c
			break
		}
	}

	recForbidden := httptest.NewRecorder()
	reqForbidden := httptest.NewRequest(http.MethodGet, "/api/v1/admin/overview", nil)
	reqForbidden.AddCookie(pCookie)
	handler.ServeHTTP(recForbidden, reqForbidden)

	if recForbidden.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for passenger accessing admin overview, got %d", recForbidden.Code)
	}

	// 3. Request with Admin session cookie must succeed with 200
	admLoginBody := map[string]any{
		"phone":    "+254700000001",
		"password": "Pass1234!",
	}
	admBytes, _ := json.Marshal(admLoginBody)
	recAdmLogin := httptest.NewRecorder()
	reqAdmLogin := httptest.NewRequest(http.MethodPost, "/api/v1/admin/login", bytes.NewReader(admBytes))
	reqAdmLogin.Header.Set("Content-Type", "application/json")
	reqAdmLogin.Header.Set("X-CSRF-Token", token)
	handler.ServeHTTP(recAdmLogin, reqAdmLogin)

	var admCookie *http.Cookie
	for _, c := range recAdmLogin.Result().Cookies() {
		if c.Name == "rider_session" {
			admCookie = c
			break
		}
	}

	recAdmSuccess := httptest.NewRecorder()
	reqAdmSuccess := httptest.NewRequest(http.MethodGet, "/api/v1/admin/overview", nil)
	reqAdmSuccess.AddCookie(admCookie)
	handler.ServeHTTP(recAdmSuccess, reqAdmSuccess)

	if recAdmSuccess.Code != http.StatusOK {
		t.Fatalf("expected 200 for admin accessing admin overview, got %d", recAdmSuccess.Code)
	}
}

func TestRider_AvailabilityEligibilityGate(t *testing.T) {
	_, s, _, handler := setupTestApp()

	// 1. Log in as Juma (verified rider)
	recCSRF := httptest.NewRecorder()
	reqCSRF := httptest.NewRequest(http.MethodGet, "/api/v1/auth/csrf", nil)
	handler.ServeHTTP(recCSRF, reqCSRF)
	var csrfResp SuccessResponse
	_ = json.NewDecoder(recCSRF.Body).Decode(&csrfResp)
	token := csrfResp.Data.(map[string]any)["csrf_token"].(string)

	loginBody := map[string]any{
		"phone":    "+254722458912",
		"password": "Pass1234!",
	}
	lBytes, _ := json.Marshal(loginBody)
	recLogin := httptest.NewRecorder()
	reqLogin := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(lBytes))
	reqLogin.Header.Set("Content-Type", "application/json")
	reqLogin.Header.Set("X-CSRF-Token", token)
	handler.ServeHTTP(recLogin, reqLogin)

	var jumaCookie *http.Cookie
	for _, c := range recLogin.Result().Cookies() {
		if c.Name == "rider_session" {
			jumaCookie = c
			break
		}
	}

	// Juma goes online: should succeed (200)
	onlineBody := map[string]any{"is_online": true}
	oBytes, _ := json.Marshal(onlineBody)
	recOnline := httptest.NewRecorder()
	reqOnline := httptest.NewRequest(http.MethodPost, "/api/v1/rider/presence", bytes.NewReader(oBytes))
	reqOnline.Header.Set("Content-Type", "application/json")
	reqOnline.Header.Set("X-CSRF-Token", token)
	reqOnline.AddCookie(jumaCookie)
	handler.ServeHTTP(recOnline, reqOnline)

	if recOnline.Code != http.StatusOK {
		t.Fatalf("expected 200 for verified rider going online, got %d: %s", recOnline.Code, recOnline.Body.String())
	}

	// 2. Log in as Peter (pending unverified rider)
	pLoginBody := map[string]any{
		"phone":    "+254711998877",
		"password": "Pass1234!",
	}
	plBytes, _ := json.Marshal(pLoginBody)
	recPLogin := httptest.NewRecorder()
	reqPLogin := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(plBytes))
	reqPLogin.Header.Set("Content-Type", "application/json")
	reqPLogin.Header.Set("X-CSRF-Token", token)
	handler.ServeHTTP(recPLogin, reqPLogin)

	var peterCookie *http.Cookie
	for _, c := range recPLogin.Result().Cookies() {
		if c.Name == "rider_session" {
			peterCookie = c
			break
		}
	}

	// Peter attempts to go online: MUST BE REJECTED with 403 Forbidden!
	recPeterOnline := httptest.NewRecorder()
	reqPeterOnline := httptest.NewRequest(http.MethodPost, "/api/v1/rider/presence", bytes.NewReader(oBytes))
	reqPeterOnline.Header.Set("Content-Type", "application/json")
	reqPeterOnline.Header.Set("X-CSRF-Token", token)
	reqPeterOnline.AddCookie(peterCookie)
	handler.ServeHTTP(recPeterOnline, reqPeterOnline)

	if recPeterOnline.Code != http.StatusForbidden {
		t.Fatalf("expected 403 Forbidden for unverified rider going online, got %d", recPeterOnline.Code)
	}

	// Now if Admin approves Peter's verification and activates trial subscription...
	_ = s.UpdateRiderProfile(reqPeterOnline.Context(), &models.RiderProfile{
		UserID:             "usr_rider_peter",
		DisplayName:        "Peter Ochieng",
		VerificationStatus: models.VerificationApproved,
		AccountStatus:      models.UserStatusActive,
	})
	_ = s.UpsertRiderSubscription(reqPeterOnline.Context(), &models.RiderSubscription{
		ID:        "sub_peter_pilot",
		RiderID:   "usr_rider_peter",
		PlanID:    "plan_pilot_trial",
		Status:    models.SubStatusTrial,
		StartsAt:  time.Now().UTC(),
		ExpiresAt: time.Now().UTC().Add(30 * 24 * time.Hour),
		CreatedAt: time.Now().UTC(),
	})

	// Peter tries again: MUST NOW SUCCEED!
	recPeterRetry := httptest.NewRecorder()
	reqPeterRetry := httptest.NewRequest(http.MethodPost, "/api/v1/rider/presence", bytes.NewReader(oBytes))
	reqPeterRetry.Header.Set("Content-Type", "application/json")
	reqPeterRetry.Header.Set("X-CSRF-Token", token)
	reqPeterRetry.AddCookie(peterCookie)
	handler.ServeHTTP(recPeterRetry, reqPeterRetry)

	if recPeterRetry.Code != http.StatusOK {
		t.Fatalf("expected 200 for approved rider going online, got %d: %s", recPeterRetry.Code, recPeterRetry.Body.String())
	}
}

func TestTripLifecycle_EndToEnd(t *testing.T) {
	_, s, _, handler := setupTestApp()

	// 1. Get CSRF token
	recCSRF := httptest.NewRecorder()
	reqCSRF := httptest.NewRequest(http.MethodGet, "/api/v1/auth/csrf", nil)
	handler.ServeHTTP(recCSRF, reqCSRF)
	var csrfResp SuccessResponse
	_ = json.NewDecoder(recCSRF.Body).Decode(&csrfResp)
	token := csrfResp.Data.(map[string]any)["csrf_token"].(string)

	// 2. Login Passenger (+254 712 345 678)
	passLoginBytes, _ := json.Marshal(map[string]string{
		"phone":    "+254 712 345 678",
		"password": "Pass1234!",
	})
	recPassLogin := httptest.NewRecorder()
	reqPassLogin := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(passLoginBytes))
	reqPassLogin.Header.Set("Content-Type", "application/json")
	reqPassLogin.Header.Set("X-CSRF-Token", token)
	handler.ServeHTTP(recPassLogin, reqPassLogin)
	if recPassLogin.Code != http.StatusOK {
		t.Fatalf("passenger login failed: %d", recPassLogin.Code)
	}
	var passCookie *http.Cookie
	for _, c := range recPassLogin.Result().Cookies() {
		if c.Name == "rider_session" {
			passCookie = c
			break
		}
	}

	// 3. Login Rider (+254 722 458 912)
	riderLoginBytes, _ := json.Marshal(map[string]string{
		"phone":    "+254 722 458 912",
		"password": "Pass1234!",
	})
	recRiderLogin := httptest.NewRecorder()
	reqRiderLogin := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(riderLoginBytes))
	reqRiderLogin.Header.Set("Content-Type", "application/json")
	reqRiderLogin.Header.Set("X-CSRF-Token", token)
	handler.ServeHTTP(recRiderLogin, reqRiderLogin)
	if recRiderLogin.Code != http.StatusOK {
		t.Fatalf("rider login failed: %d", recRiderLogin.Code)
	}
	var riderCookie *http.Cookie
	for _, c := range recRiderLogin.Result().Cookies() {
		if c.Name == "rider_session" {
			riderCookie = c
			break
		}
	}

	// 4. Ensure Rider is Online at Westlands
	posBytes, _ := json.Marshal(map[string]any{
		"latitude":  -1.2673,
		"longitude": 36.8111,
		"accuracy":  5.0,
	})
	recLoc := httptest.NewRecorder()
	reqLoc := httptest.NewRequest(http.MethodPost, "/api/v1/rider/location", bytes.NewReader(posBytes))
	reqLoc.Header.Set("Content-Type", "application/json")
	reqLoc.Header.Set("X-CSRF-Token", token)
	reqLoc.AddCookie(riderCookie)
	handler.ServeHTTP(recLoc, reqLoc)
	if recLoc.Code != http.StatusOK {
		t.Fatalf("rider location update failed: %d", recLoc.Code)
	}

	// 5. Passenger Requests Server Pricing Quote
	quotePayload, _ := json.Marshal(map[string]any{
		"pickup_address": "Westlands Mall, Nairobi",
		"dest_address":   "Nairobi CBD Kencom",
		"distance_km":    4.2,
		"pickup_lat":     -1.2673,
		"pickup_lng":     36.8111,
		"dest_lat":       -1.2841,
		"dest_lng":       36.8228,
	})
	recQuote := httptest.NewRecorder()
	reqQuote := httptest.NewRequest(http.MethodPost, "/api/v1/quotes", bytes.NewReader(quotePayload))
	reqQuote.Header.Set("Content-Type", "application/json")
	reqQuote.Header.Set("X-CSRF-Token", token)
	handler.ServeHTTP(recQuote, reqQuote)
	if recQuote.Code != http.StatusOK {
		t.Fatalf("quote request failed: %d", recQuote.Code)
	}
	var quoteResp SuccessResponse
	_ = json.NewDecoder(recQuote.Body).Decode(&quoteResp)
	quoteData := quoteResp.Data.(map[string]any)
	quoteID := quoteData["id"].(string)

	// 6. Passenger Books Trip
	bookPayload, _ := json.Marshal(map[string]any{
		"quote_id":       quoteID,
		"pickup_address": "Westlands Mall, Nairobi",
		"dest_address":   "Nairobi CBD Kencom",
		"pickup_lat":     -1.2673,
		"pickup_lng":     36.8111,
		"dest_lat":       -1.2841,
		"dest_lng":       36.8228,
	})
	recBook := httptest.NewRecorder()
	reqBook := httptest.NewRequest(http.MethodPost, "/api/v1/trips", bytes.NewReader(bookPayload))
	reqBook.Header.Set("Content-Type", "application/json")
	reqBook.Header.Set("X-CSRF-Token", token)
	reqBook.AddCookie(passCookie)
	handler.ServeHTTP(recBook, reqBook)
	if recBook.Code != http.StatusCreated {
		t.Fatalf("trip booking failed: %d, %s", recBook.Code, recBook.Body.String())
	}
	var bookResp SuccessResponse
	_ = json.NewDecoder(recBook.Body).Decode(&bookResp)
	tripData := bookResp.Data.(map[string]any)
	tripID := tripData["id"].(string)

	// 7. Rider Checks Active Dispatched Offer
	recOffer := httptest.NewRecorder()
	reqOffer := httptest.NewRequest(http.MethodGet, "/api/v1/rider/offers/active", nil)
	reqOffer.AddCookie(riderCookie)
	handler.ServeHTTP(recOffer, reqOffer)
	if recOffer.Code != http.StatusOK {
		t.Fatalf("fetch active offer failed: %d", recOffer.Code)
	}
	var offerResp SuccessResponse
	_ = json.NewDecoder(recOffer.Body).Decode(&offerResp)
	if offerResp.Data == nil {
		t.Fatalf("expected dispatched offer for online rider, got nil")
	}

	// 8. Rider Accepts Trip Offer
	recAccept := httptest.NewRecorder()
	reqAccept := httptest.NewRequest(http.MethodPost, "/api/v1/trips/"+tripID+"/accept", nil)
	reqAccept.Header.Set("X-CSRF-Token", token)
	reqAccept.AddCookie(riderCookie)
	handler.ServeHTTP(recAccept, reqAccept)
	if recAccept.Code != http.StatusOK {
		t.Fatalf("rider accept trip failed: %d: %s", recAccept.Code, recAccept.Body.String())
	}

	// 9. Trip Stepper: arrived -> in_progress -> completed
	transitions := []string{models.TripStatusRiderArrived, models.TripStatusInProgress, models.TripStatusCompleted}
	for _, nextStatus := range transitions {
		stBytes, _ := json.Marshal(map[string]string{"status": nextStatus})
		recSt := httptest.NewRecorder()
		reqSt := httptest.NewRequest(http.MethodPatch, "/api/v1/trips/"+tripID+"/status", bytes.NewReader(stBytes))
		reqSt.Header.Set("Content-Type", "application/json")
		reqSt.Header.Set("X-CSRF-Token", token)
		reqSt.AddCookie(riderCookie)
		handler.ServeHTTP(recSt, reqSt)
		if recSt.Code != http.StatusOK {
			t.Fatalf("status transition to %s failed: %d: %s", nextStatus, recSt.Code, recSt.Body.String())
		}
	}

	// 10. Rider Records Cash Payment Collection
	recPay := httptest.NewRecorder()
	reqPay := httptest.NewRequest(http.MethodPost, "/api/v1/trips/"+tripID+"/payment", nil)
	reqPay.Header.Set("X-CSRF-Token", token)
	reqPay.AddCookie(riderCookie)
	handler.ServeHTTP(recPay, reqPay)
	if recPay.Code != http.StatusOK {
		t.Fatalf("cash payment record failed: %d: %s", recPay.Code, recPay.Body.String())
	}

	// 11. Verify 0% Commission Ledger
	recEarn := httptest.NewRecorder()
	reqEarn := httptest.NewRequest(http.MethodGet, "/api/v1/rider/earnings", nil)
	reqEarn.AddCookie(riderCookie)
	handler.ServeHTTP(recEarn, reqEarn)
	if recEarn.Code != http.StatusOK {
		t.Fatalf("earnings fetch failed: %d", recEarn.Code)
	}
	var earnResp SuccessResponse
	_ = json.NewDecoder(recEarn.Body).Decode(&earnResp)
	earnData := earnResp.Data.(map[string]any)

	// Commission rate MUST BE 0%
	commissionRate := earnData["commission_rate"].(string)
	if commissionRate != "0%" {
		t.Errorf("expected commission_rate '0%%', got %s", commissionRate)
	}
	platformFee := earnData["platform_deduction_minor"].(float64)
	if platformFee != 0 {
		t.Errorf("expected platform_deduction_minor 0, got %f", platformFee)
	}

	// Verify Trip is in Completed state in Store
	storedTrip, err := s.GetTripByID(reqEarn.Context(), tripID)
	if err != nil || storedTrip.Status != models.TripStatusCompleted {
		t.Fatalf("expected trip status %s, got %v", models.TripStatusCompleted, storedTrip)
	}
}

