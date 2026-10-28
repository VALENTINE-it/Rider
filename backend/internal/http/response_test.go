package http

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestJSONResponse(t *testing.T) {
	rec := httptest.NewRecorder()
	reqID := "req_test123"

	payload := map[string]string{"status": "ok"}
	JSON(rec, http.StatusOK, payload, reqID)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	var resp SuccessResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode json response: %v", err)
	}

	if resp.Meta.RequestID != reqID {
		t.Errorf("expected request_id %s, got %s", reqID, resp.Meta.RequestID)
	}
}

func TestJSONErrorResponse(t *testing.T) {
	rec := httptest.NewRecorder()
	reqID := "req_err456"

	JSONError(rec, http.StatusNotFound, "NOT_FOUND", "Resource not found", nil, reqID)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected status 404, got %d", rec.Code)
	}

	var resp ErrorResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode json response: %v", err)
	}

	if resp.Error.Code != "NOT_FOUND" {
		t.Errorf("expected error code NOT_FOUND, got %s", resp.Error.Code)
	}
	if resp.Meta.RequestID != reqID {
		t.Errorf("expected request_id %s, got %s", reqID, resp.Meta.RequestID)
	}
}
