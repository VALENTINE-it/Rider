package http

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHealthEndpoints(t *testing.T) {
	router := NewRouter()
	handler := router.Routes()

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

func TestPricingQuoteCalculation(t *testing.T) {
	router := NewRouter()
	handler := router.Routes()

	body := map[string]any{
		"pickup_address": "Westlands",
		"dest_address":   "Nairobi CBD",
		"distance_km":    4.0,
	}
	bodyBytes, _ := json.Marshal(body)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/quotes", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
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
}
