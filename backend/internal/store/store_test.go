package store_test

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/VALENTINE-it/Rider/backend/internal/models"
	"github.com/VALENTINE-it/Rider/backend/internal/store"
	"golang.org/x/crypto/bcrypt"
)

func TestMemoryStore_UserAndCredentials(t *testing.T) {
	s := store.NewMemoryStore()
	ctx := context.Background()

	pwdHash, _ := bcrypt.GenerateFromPassword([]byte("secret123"), bcrypt.DefaultCost)
	u := &models.User{
		ID:        "u_test_1",
		PhoneE164: "+254711223344",
		Status:    models.UserStatusActive,
		Roles:     []string{models.RolePassenger},
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	}

	if err := s.CreateUser(ctx, u, string(pwdHash)); err != nil {
		t.Fatalf("expected successful user creation, got %v", err)
	}

	// Duplicate phone check
	dupUser := &models.User{
		ID:        "u_test_2",
		PhoneE164: "+254711223344",
		Status:    models.UserStatusActive,
		Roles:     []string{models.RolePassenger},
	}
	if err := s.CreateUser(ctx, dupUser, string(pwdHash)); err != store.ErrDuplicatePhone {
		t.Fatalf("expected ErrDuplicatePhone, got %v", err)
	}

	// Password retrieval
	hash, err := s.GetPasswordHash(ctx, u.ID)
	if err != nil {
		t.Fatalf("expected password hash, got %v", err)
	}
	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte("secret123")); err != nil {
		t.Fatalf("password mismatch: %v", err)
	}
}

func TestMemoryStore_Sessions(t *testing.T) {
	s := store.NewMemoryStore()
	ctx := context.Background()

	sess := &models.Session{
		ID:         "sess_1",
		UserID:     "usr_passenger_kevin",
		TokenHash:  "hash123",
		ExpiresAt:  time.Now().UTC().Add(1 * time.Hour),
		CreatedAt:  time.Now().UTC(),
		LastSeenAt: time.Now().UTC(),
	}

	if err := s.CreateSession(ctx, sess); err != nil {
		t.Fatalf("failed to create session: %v", err)
	}

	retrieved, err := s.GetSessionByTokenHash(ctx, "hash123")
	if err != nil || retrieved.ID != sess.ID {
		t.Fatalf("failed to retrieve session: %v", err)
	}

	// Revoke session
	if err := s.RevokeSession(ctx, sess.ID); err != nil {
		t.Fatalf("failed to revoke session: %v", err)
	}

	_, err = s.GetSessionByTokenHash(ctx, "hash123")
	if err != store.ErrSessionExpired {
		t.Fatalf("expected ErrSessionExpired, got %v", err)
	}
}

func TestMemoryStore_NearbyEligibleRiders(t *testing.T) {
	s := store.NewMemoryStore()
	ctx := context.Background()

	// Seed rider Juma is at Westlands (-1.2673, 36.8111), verified, online, trial sub
	// Passenger at Parklands (-1.2650, 36.8150), ~0.5 km away
	riders, err := s.FindNearbyEligibleRiders(ctx, -1.2650, 36.8150, 3.0, 10)
	if err != nil {
		t.Fatalf("FindNearbyEligibleRiders error: %v", err)
	}

	if len(riders) != 1 || riders[0].UserID != "usr_rider_juma" {
		t.Fatalf("expected 1 rider (Juma), got %d riders", len(riders))
	}

	// Unverified rider Peter Ochieng should NOT be returned
	for _, r := range riders {
		if r.UserID == "usr_rider_peter" {
			t.Fatalf("unverified rider Peter should not be eligible")
		}
	}

	// If Juma goes offline, he should no longer be eligible
	_ = s.SetRiderPresence(ctx, "usr_rider_juma", false)
	ridersOffline, err := s.FindNearbyEligibleRiders(ctx, -1.2650, 36.8150, 3.0, 10)
	if err != nil {
		t.Fatalf("FindNearbyEligibleRiders error: %v", err)
	}
	if len(ridersOffline) != 0 {
		t.Fatalf("expected 0 riders when offline, got %d", len(ridersOffline))
	}
}

func TestMemoryStore_AtomicTripAssignmentConcurrency(t *testing.T) {
	s := store.NewMemoryStore()
	ctx := context.Background()

	tripID := "trip_race_1"
	t1 := &models.Trip{
		ID:            tripID,
		PassengerID:   "usr_passenger_kevin",
		Status:        models.TripStatusSearching,
		PickupAddress: "Westlands Mall",
		DestAddress:   "Nairobi CBD",
		FareMinor:     18000,
		Currency:      "KES",
		CreatedAt:     time.Now().UTC(),
		UpdatedAt:     time.Now().UTC(),
	}
	_ = s.CreateTrip(ctx, t1)

	// Simulate 10 riders trying to accept the trip simultaneously
	const numRiders = 10
	var wg sync.WaitGroup
	wg.Add(numRiders)

	successCount := 0
	conflictCount := 0
	var mu sync.Mutex

	for i := 1; i <= numRiders; i++ {
		riderID := "rider_" + string(rune('A'+i))
		go func(rID string) {
			defer wg.Done()
			err := s.AssignTripToRider(ctx, tripID, rID)
			mu.Lock()
			defer mu.Unlock()
			if err == nil {
				successCount++
			} else if err == store.ErrTripAlreadyAssigned {
				conflictCount++
			}
		}(riderID)
	}

	wg.Wait()

	// Invariant: Exactly ONE assignment succeeds, all others receive ErrTripAlreadyAssigned
	if successCount != 1 {
		t.Fatalf("expected exactly 1 success, got %d", successCount)
	}
	if conflictCount != numRiders-1 {
		t.Fatalf("expected %d conflicts, got %d", numRiders-1, conflictCount)
	}

	// Verify trip state
	assignedTrip, err := s.GetTripByID(ctx, tripID)
	if err != nil {
		t.Fatalf("failed to get trip: %v", err)
	}
	if assignedTrip.Status != models.TripStatusAssigned || assignedTrip.RiderID == nil {
		t.Fatalf("trip should be assigned with a valid rider ID")
	}
}

func TestMemoryStore_TripStateMachineTransitions(t *testing.T) {
	s := store.NewMemoryStore()
	ctx := context.Background()

	tripID := "trip_sm_1"
	t1 := &models.Trip{
		ID:            tripID,
		PassengerID:   "usr_passenger_kevin",
		Status:        models.TripStatusRequested,
		PickupAddress: "CBD",
		DestAddress:   "Kilimani",
		FareMinor:     25000,
		CreatedAt:     time.Now().UTC(),
		UpdatedAt:     time.Now().UTC(),
	}
	_ = s.CreateTrip(ctx, t1)

	// Legal: requested -> searching
	if err := s.UpdateTripStatus(ctx, tripID, models.TripStatusSearching, "system", nil); err != nil {
		t.Fatalf("expected valid transition requested -> searching, got %v", err)
	}

	// Illegal: searching -> completed directly
	if err := s.UpdateTripStatus(ctx, tripID, models.TripStatusCompleted, "system", nil); err == nil {
		t.Fatalf("expected illegal transition error, got nil")
	}

	// Assign trip
	if err := s.AssignTripToRider(ctx, tripID, "usr_rider_juma"); err != nil {
		t.Fatalf("failed to assign trip: %v", err)
	}

	// Legal: assigned -> arriving
	if err := s.UpdateTripStatus(ctx, tripID, models.TripStatusRiderArriving, "usr_rider_juma", nil); err != nil {
		t.Fatalf("expected valid transition assigned -> arriving, got %v", err)
	}

	// Legal: arriving -> arrived
	if err := s.UpdateTripStatus(ctx, tripID, models.TripStatusRiderArrived, "usr_rider_juma", nil); err != nil {
		t.Fatalf("expected valid transition arriving -> arrived, got %v", err)
	}

	// Legal: arrived -> in_progress
	if err := s.UpdateTripStatus(ctx, tripID, models.TripStatusInProgress, "usr_rider_juma", nil); err != nil {
		t.Fatalf("expected valid transition arrived -> in_progress, got %v", err)
	}

	// Legal: in_progress -> completed
	if err := s.UpdateTripStatus(ctx, tripID, models.TripStatusCompleted, "usr_rider_juma", nil); err != nil {
		t.Fatalf("expected valid transition in_progress -> completed, got %v", err)
	}

	// Verify events
	events, err := s.ListTripEvents(ctx, tripID)
	if err != nil || len(events) < 5 {
		t.Fatalf("expected at least 5 audit events, got %d", len(events))
	}
}
