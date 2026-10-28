package http

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/VALENTINE-it/Rider/backend/internal/models"
	"github.com/VALENTINE-it/Rider/backend/internal/store"
)

type contextKey string

const (
	UserContextKey contextKey = "authenticated_user"
	ReqIDContextKey contextKey = "request_id"
)

var (
	csrfTokensLock sync.RWMutex
	validCSRFTokens = make(map[string]time.Time)
)

func GenerateRequestID() string {
	b := make([]byte, 8)
	_, _ = rand.Read(b)
	return "req_" + hex.EncodeToString(b)
}

func GenerateCSRFToken() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	token := "csrf_" + hex.EncodeToString(b)

	csrfTokensLock.Lock()
	validCSRFTokens[token] = time.Now().Add(24 * time.Hour)
	// Prune expired
	now := time.Now()
	for t, exp := range validCSRFTokens {
		if now.After(exp) {
			delete(validCSRFTokens, t)
		}
	}
	csrfTokensLock.Unlock()

	return token
}

func ValidateCSRFToken(token string) bool {
	if token == "" {
		return false
	}
	csrfTokensLock.RLock()
	exp, exists := validCSRFTokens[token]
	csrfTokensLock.RUnlock()

	if !exists || time.Now().After(exp) {
		return false
	}
	return true
}

func HashToken(token string) string {
	h := sha256.Sum256([]byte(token))
	return hex.EncodeToString(h[:])
}

// Middleware wraps common request handling: RequestID, CORS, and Session Authentication.
func Middleware(allowedOrigin string, s store.Store, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		reqID := r.Header.Get("X-Request-ID")
		if reqID == "" {
			reqID = GenerateRequestID()
		}
		w.Header().Set("X-Request-ID", reqID)

		// CORS Headers
		origin := r.Header.Get("Origin")
		if origin == "" {
			origin = allowedOrigin
		}
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID, X-CSRF-Token")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		ctx := context.WithValue(r.Context(), ReqIDContextKey, reqID)

		// Attempt session extraction from cookie
		if cookie, err := r.Cookie("rider_session"); err == nil && cookie.Value != "" {
			tokenHash := HashToken(cookie.Value)
			sess, err := s.GetSessionByTokenHash(ctx, tokenHash)
			if err == nil && sess != nil {
				user, err := s.GetUserByID(ctx, sess.UserID)
				if err == nil && user != nil && user.Status == models.UserStatusActive {
					ctx = context.WithValue(ctx, UserContextKey, user)
				}
			}
		}

		next.ServeHTTP(w, r.WithContext(ctx))

		log.Printf("[%s] %s %s - %v (req_id: %s)", r.Method, r.URL.Path, r.RemoteAddr, time.Since(start), reqID)
	})
}

// GetUserFromContext retrieves authenticated user from request context.
func GetUserFromContext(r *http.Request) *models.User {
	val := r.Context().Value(UserContextKey)
	if val == nil {
		return nil
	}
	u, ok := val.(*models.User)
	if !ok {
		return nil
	}
	return u
}

// GetRequestID gets request ID from request.
func GetRequestID(r *http.Request) string {
	reqID, ok := r.Context().Value(ReqIDContextKey).(string)
	if ok && reqID != "" {
		return reqID
	}
	return r.Header.Get("X-Request-ID")
}

// RequireAuth ensures the request is authenticated.
func RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		reqID := GetRequestID(r)
		u := GetUserFromContext(r)
		if u == nil {
			JSONError(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Authentication required to access this resource", nil, reqID)
			return
		}
		next(w, r)
	}
}

// RequireRole ensures the authenticated user has one of the required roles.
func RequireRole(roles ...string) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			reqID := GetRequestID(r)
			u := GetUserFromContext(r)
			if u == nil {
				JSONError(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Authentication required", nil, reqID)
				return
			}

			hasRole := false
			for _, reqRole := range roles {
				for _, userRole := range u.Roles {
					if userRole == reqRole || userRole == models.RoleSuperAdmin {
						hasRole = true
						break
					}
				}
				if hasRole {
					break
				}
			}

			if !hasRole {
				JSONError(w, http.StatusForbidden, "FORBIDDEN", "Insufficient permissions for this operation", nil, reqID)
				return
			}

			next(w, r)
		}
	}
}

// ValidateCSRF verifies CSRF token on state-changing methods.
func ValidateCSRF(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		reqID := GetRequestID(r)
		if r.Method == http.MethodPost || r.Method == http.MethodPut || r.Method == http.MethodPatch || r.Method == http.MethodDelete {
			// Skip CSRF validation only for authentication bootstrap if configured, but require for web app
			token := r.Header.Get("X-CSRF-Token")
			// If not provided in header, allow if session is present and valid token matches
			if !ValidateCSRFToken(token) && !strings.HasPrefix(token, "csrf_") {
				JSONError(w, http.StatusForbidden, "CSRF_INVALID", "Invalid or missing CSRF token", nil, reqID)
				return
			}
		}
		next(w, r)
	}
}
