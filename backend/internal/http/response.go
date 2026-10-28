package http

import (
	"encoding/json"
	"net/http"
)

// Meta represents metadata block per docs/API.md section 2.1
type Meta struct {
	RequestID  string `json:"request_id"`
	Limit      int    `json:"limit,omitempty"`
	NextCursor string `json:"next_cursor,omitempty"`
}

// SuccessResponse defines { "data": ..., "meta": ... }
type SuccessResponse struct {
	Data any  `json:"data"`
	Meta Meta `json:"meta"`
}

// ErrorDetail provides validation breakdown per field
type ErrorDetail struct {
	Field  string `json:"field"`
	Reason string `json:"reason"`
}

// ErrorPayload defines { "code": ..., "message": ..., "details": ... }
type ErrorPayload struct {
	Code    string        `json:"code"`
	Message string        `json:"message"`
	Details []ErrorDetail `json:"details"`
}

// ErrorResponse defines { "error": ..., "meta": ... }
type ErrorResponse struct {
	Error ErrorPayload `json:"error"`
	Meta  Meta         `json:"meta"`
}

func JSON(w http.ResponseWriter, status int, data any, reqID string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)

	resp := SuccessResponse{
		Data: data,
		Meta: Meta{RequestID: reqID},
	}
	_ = json.NewEncoder(w).Encode(resp)
}

func JSONError(w http.ResponseWriter, status int, code, message string, details []ErrorDetail, reqID string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)

	if details == nil {
		details = []ErrorDetail{}
	}

	resp := ErrorResponse{
		Error: ErrorPayload{
			Code:    code,
			Message: message,
			Details: details,
		},
		Meta: Meta{RequestID: reqID},
	}
	_ = json.NewEncoder(w).Encode(resp)
}
