package store

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/VALENTINE-it/Rider/backend/internal/models"
	_ "github.com/lib/pq"
)

// PostgresStore implements Store backed by PostgreSQL and PostGIS.
type PostgresStore struct {
	db *sql.DB
}

// NewPostgresStore creates a new PostgreSQL store and verifies connectivity.
func NewPostgresStore(databaseURL string) (*PostgresStore, error) {
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &PostgresStore{db: db}, nil
}

func (ps *PostgresStore) Close() error {
	return ps.db.Close()
}

// -----------------------------------------------------------------------------
// PostgreSQL Implementations with Parameterized SQL (docs/DATABASE.md)
// -----------------------------------------------------------------------------

func (ps *PostgresStore) CreateUser(ctx context.Context, u *models.User, passwordHash string) error {
	tx, err := ps.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	queryUser := `INSERT INTO users (id, phone_e164, status, created_at, updated_at) 
	              VALUES ($1, $2, $3, $4, $5)`
	if _, err := tx.ExecContext(ctx, queryUser, u.ID, u.PhoneE164, u.Status, u.CreatedAt, u.UpdatedAt); err != nil {
		return fmt.Errorf("%w: %v", ErrDuplicatePhone, err)
	}

	queryCred := `INSERT INTO credentials (user_id, password_hash, password_updated_at) 
	              VALUES ($1, $2, $3)`
	if _, err := tx.ExecContext(ctx, queryCred, u.ID, passwordHash, u.CreatedAt); err != nil {
		return err
	}

	return tx.Commit()
}

func (ps *PostgresStore) GetUserByID(ctx context.Context, id string) (*models.User, error) {
	row := ps.db.QueryRowContext(ctx, `SELECT id, phone_e164, phone_verified_at, status, created_at, updated_at 
	                                  FROM users WHERE id = $1`, id)
	var u models.User
	if err := row.Scan(&u.ID, &u.PhoneE164, &u.PhoneVerifiedAt, &u.Status, &u.CreatedAt, &u.UpdatedAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &u, nil
}

func (ps *PostgresStore) GetUserByPhone(ctx context.Context, phone string) (*models.User, error) {
	row := ps.db.QueryRowContext(ctx, `SELECT id, phone_e164, phone_verified_at, status, created_at, updated_at 
	                                  FROM users WHERE phone_e164 = $1`, phone)
	var u models.User
	if err := row.Scan(&u.ID, &u.PhoneE164, &u.PhoneVerifiedAt, &u.Status, &u.CreatedAt, &u.UpdatedAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &u, nil
}

func (ps *PostgresStore) GetPasswordHash(ctx context.Context, userID string) (string, error) {
	var hash string
	err := ps.db.QueryRowContext(ctx, `SELECT password_hash FROM credentials WHERE user_id = $1`, userID).Scan(&hash)
	if err == sql.ErrNoRows {
		return "", ErrNotFound
	}
	return hash, err
}

func (ps *PostgresStore) UpdateUserStatus(ctx context.Context, userID, status string) error {
	res, err := ps.db.ExecContext(ctx, `UPDATE users SET status = $1, updated_at = now() WHERE id = $2`, status, userID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func (ps *PostgresStore) ListUsers(ctx context.Context, role, status string) ([]*models.User, error) {
	query := `SELECT id, phone_e164, phone_verified_at, status, created_at, updated_at FROM users WHERE 1=1`
	var args []any
	argIdx := 1
	if status != "" {
		query += fmt.Sprintf(" AND status = $%d", argIdx)
		args = append(args, status)
		argIdx++
	}
	query += " ORDER BY created_at DESC"

	rows, err := ps.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.PhoneE164, &u.PhoneVerifiedAt, &u.Status, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		users = append(users, &u)
	}
	return users, nil
}

func (ps *PostgresStore) CreateSession(ctx context.Context, s *models.Session) error {
	query := `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at, last_seen_at) 
	          VALUES ($1, $2, decode($3, 'hex'), $4, $5, $6)`
	_, err := ps.db.ExecContext(ctx, query, s.ID, s.UserID, s.TokenHash, s.ExpiresAt, s.CreatedAt, s.LastSeenAt)
	return err
}

func (ps *PostgresStore) GetSessionByTokenHash(ctx context.Context, tokenHash string) (*models.Session, error) {
	query := `SELECT id, user_id, encode(token_hash, 'hex'), expires_at, revoked_at, created_at, last_seen_at 
	          FROM sessions 
	          WHERE token_hash = decode($1, 'hex') AND revoked_at IS NULL AND expires_at > now()`
	var s models.Session
	var hash string
	err := ps.db.QueryRowContext(ctx, query, tokenHash).Scan(
		&s.ID, &s.UserID, &hash, &s.ExpiresAt, &s.RevokedAt, &s.CreatedAt, &s.LastSeenAt,
	)
	if err == sql.ErrNoRows {
		return nil, ErrSessionExpired
	}
	if err != nil {
		return nil, err
	}
	s.TokenHash = hash
	return &s, nil
}

func (ps *PostgresStore) RevokeSession(ctx context.Context, sessionID string) error {
	_, err := ps.db.ExecContext(ctx, `UPDATE sessions SET revoked_at = now() WHERE id = $1`, sessionID)
	return err
}

func (ps *PostgresStore) RevokeAllUserSessions(ctx context.Context, userID string) error {
	_, err := ps.db.ExecContext(ctx, `UPDATE sessions SET revoked_at = now() WHERE user_id = $1`, userID)
	return err
}

func (ps *PostgresStore) CreatePassengerProfile(ctx context.Context, p *models.PassengerProfile) error {
	query := `INSERT INTO passenger_profiles (user_id, display_name, created_at) VALUES ($1, $2, $3)`
	_, err := ps.db.ExecContext(ctx, query, p.UserID, p.DisplayName, p.CreatedAt)
	return err
}

func (ps *PostgresStore) GetPassengerProfile(ctx context.Context, userID string) (*models.PassengerProfile, error) {
	row := ps.db.QueryRowContext(ctx, `SELECT user_id, display_name, created_at FROM passenger_profiles WHERE user_id = $1`, userID)
	var p models.PassengerProfile
	if err := row.Scan(&p.UserID, &p.DisplayName, &p.CreatedAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &p, nil
}

func (ps *PostgresStore) UpdatePassengerProfile(ctx context.Context, p *models.PassengerProfile) error {
	_, err := ps.db.ExecContext(ctx, `UPDATE passenger_profiles SET display_name = $1 WHERE user_id = $2`, p.DisplayName, p.UserID)
	return err
}

func (ps *PostgresStore) CreateRiderProfile(ctx context.Context, r *models.RiderProfile) error {
	query := `INSERT INTO rider_profiles (user_id, display_name, verification_status, account_status, created_at, updated_at) 
	          VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := ps.db.ExecContext(ctx, query, r.UserID, r.DisplayName, r.VerificationStatus, r.AccountStatus, r.CreatedAt, r.UpdatedAt)
	return err
}

func (ps *PostgresStore) GetRiderProfile(ctx context.Context, userID string) (*models.RiderProfile, error) {
	row := ps.db.QueryRowContext(ctx, `SELECT user_id, display_name, verification_status, account_status, created_at, updated_at 
	                                  FROM rider_profiles WHERE user_id = $1`, userID)
	var r models.RiderProfile
	if err := row.Scan(&r.UserID, &r.DisplayName, &r.VerificationStatus, &r.AccountStatus, &r.CreatedAt, &r.UpdatedAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, err
	}
	r.Rating = 4.95 // Default initial rating
	return &r, nil
}

func (ps *PostgresStore) UpdateRiderProfile(ctx context.Context, r *models.RiderProfile) error {
	query := `UPDATE rider_profiles SET display_name = $1, verification_status = $2, account_status = $3, updated_at = now() 
	          WHERE user_id = $4`
	_, err := ps.db.ExecContext(ctx, query, r.DisplayName, r.VerificationStatus, r.AccountStatus, r.UserID)
	return err
}

func (ps *PostgresStore) ListRiders(ctx context.Context, verificationStatus string) ([]*models.RiderProfile, error) {
	query := `SELECT user_id, display_name, verification_status, account_status, created_at, updated_at 
	          FROM rider_profiles WHERE 1=1`
	var args []any
	if verificationStatus != "" {
		query += " AND verification_status = $1"
		args = append(args, verificationStatus)
	}
	query += " ORDER BY created_at DESC"

	rows, err := ps.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var riders []*models.RiderProfile
	for rows.Next() {
		var r models.RiderProfile
		if err := rows.Scan(&r.UserID, &r.DisplayName, &r.VerificationStatus, &r.AccountStatus, &r.CreatedAt, &r.UpdatedAt); err != nil {
			return nil, err
		}
		r.Rating = 4.95
		riders = append(riders, &r)
	}
	return riders, nil
}

func (ps *PostgresStore) CreateMotorbike(ctx context.Context, m *models.Motorbike) error {
	query := `INSERT INTO motorbikes (id, rider_id, plate_number, model, helmet_included, status, created_at) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err := ps.db.ExecContext(ctx, query, m.ID, m.RiderID, m.PlateNumber, m.Model, m.HelmetIncluded, m.Status, m.CreatedAt)
	return err
}

func (ps *PostgresStore) GetMotorbikeByRiderID(ctx context.Context, riderID string) (*models.Motorbike, error) {
	row := ps.db.QueryRowContext(ctx, `SELECT id, rider_id, plate_number, model, helmet_included, status, created_at 
	                                  FROM motorbikes WHERE rider_id = $1`, riderID)
	var m models.Motorbike
	if err := row.Scan(&m.ID, &m.RiderID, &m.PlateNumber, &m.Model, &m.HelmetIncluded, &m.Status, &m.CreatedAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &m, nil
}

func (ps *PostgresStore) UpdateMotorbike(ctx context.Context, m *models.Motorbike) error {
	query := `UPDATE motorbikes SET plate_number = $1, model = $2, helmet_included = $3, status = $4 WHERE rider_id = $5`
	_, err := ps.db.ExecContext(ctx, query, m.PlateNumber, m.Model, m.HelmetIncluded, m.Status, m.RiderID)
	return err
}

func (ps *PostgresStore) AddVerificationDocument(ctx context.Context, d *models.VerificationDocument) error {
	query := `INSERT INTO verification_documents (id, rider_id, doc_type, file_url, status, created_at) 
	          VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := ps.db.ExecContext(ctx, query, d.ID, d.RiderID, d.DocType, d.FileURL, d.Status, d.CreatedAt)
	return err
}

func (ps *PostgresStore) GetVerificationDocuments(ctx context.Context, riderID string) ([]*models.VerificationDocument, error) {
	rows, err := ps.db.QueryContext(ctx, `SELECT id, rider_id, doc_type, file_url, status, created_at 
	                                     FROM verification_documents WHERE rider_id = $1 ORDER BY created_at DESC`, riderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var docs []*models.VerificationDocument
	for rows.Next() {
		var d models.VerificationDocument
		if err := rows.Scan(&d.ID, &d.RiderID, &d.DocType, &d.FileURL, &d.Status, &d.CreatedAt); err != nil {
			return nil, err
		}
		docs = append(docs, &d)
	}
	return docs, nil
}

func (ps *PostgresStore) AddVerificationReview(ctx context.Context, rev *models.VerificationReview) error {
	tx, err := ps.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	queryRev := `INSERT INTO verification_reviews (id, rider_id, reviewer_id, decision, notes, created_at) 
	             VALUES ($1, $2, $3, $4, $5, $6)`
	if _, err := tx.ExecContext(ctx, queryRev, rev.ID, rev.RiderID, rev.ReviewerID, rev.Decision, rev.Notes, rev.CreatedAt); err != nil {
		return err
	}

	newStatus := models.VerificationUnderReview
	switch rev.Decision {
	case "approved":
		newStatus = models.VerificationApproved
	case "rejected":
		newStatus = models.VerificationRejected
	}

	if _, err := tx.ExecContext(ctx, `UPDATE rider_profiles SET verification_status = $1, updated_at = now() WHERE user_id = $2`, newStatus, rev.RiderID); err != nil {
		return err
	}

	return tx.Commit()
}

func (ps *PostgresStore) GetVerificationReviews(ctx context.Context, riderID string) ([]*models.VerificationReview, error) {
	rows, err := ps.db.QueryContext(ctx, `SELECT id, rider_id, reviewer_id, decision, notes, created_at 
	                                     FROM verification_reviews WHERE rider_id = $1 ORDER BY created_at DESC`, riderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var revs []*models.VerificationReview
	for rows.Next() {
		var rev models.VerificationReview
		if err := rows.Scan(&rev.ID, &rev.RiderID, &rev.ReviewerID, &rev.Decision, &rev.Notes, &rev.CreatedAt); err != nil {
			return nil, err
		}
		revs = append(revs, &rev)
	}
	return revs, nil
}

// PostGIS spatial update and query
func (ps *PostgresStore) UpdateRiderLocation(ctx context.Context, loc *models.RiderLocation) error {
	query := `INSERT INTO rider_locations (rider_id, location, heading, speed_kmh, recorded_at) 
	          VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, $4, $5, $6)
	          ON CONFLICT (rider_id) DO UPDATE SET 
	            location = EXCLUDED.location,
	            heading = EXCLUDED.heading,
	            speed_kmh = EXCLUDED.speed_kmh,
	            recorded_at = EXCLUDED.recorded_at`
	_, err := ps.db.ExecContext(ctx, query, loc.RiderID, loc.Location.Longitude, loc.Location.Latitude, loc.Heading, loc.SpeedKmh, loc.RecordedAt)
	return err
}

func (ps *PostgresStore) GetRiderLocation(ctx context.Context, riderID string) (*models.RiderLocation, error) {
	query := `SELECT rider_id, ST_Y(location::geometry), ST_X(location::geometry), heading, speed_kmh, recorded_at 
	          FROM rider_locations WHERE rider_id = $1`
	var loc models.RiderLocation
	err := ps.db.QueryRowContext(ctx, query, riderID).Scan(
		&loc.RiderID, &loc.Location.Latitude, &loc.Location.Longitude, &loc.Heading, &loc.SpeedKmh, &loc.RecordedAt,
	)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	return &loc, err
}

func (ps *PostgresStore) SetRiderPresence(ctx context.Context, riderID string, isOnline bool) error {
	query := `INSERT INTO rider_presence (rider_id, is_online, last_heartbeat_at) 
	          VALUES ($1, $2, now())
	          ON CONFLICT (rider_id) DO UPDATE SET 
	            is_online = EXCLUDED.is_online,
	            last_heartbeat_at = now()`
	_, err := ps.db.ExecContext(ctx, query, riderID, isOnline)
	return err
}

func (ps *PostgresStore) GetRiderPresence(ctx context.Context, riderID string) (*models.RiderPresence, error) {
	row := ps.db.QueryRowContext(ctx, `SELECT rider_id, is_online, last_heartbeat_at FROM rider_presence WHERE rider_id = $1`, riderID)
	var p models.RiderPresence
	if err := row.Scan(&p.RiderID, &p.IsOnline, &p.LastHeartbeatAt); err != nil {
		if err == sql.ErrNoRows {
			return &models.RiderPresence{RiderID: riderID, IsOnline: false}, nil
		}
		return nil, err
	}
	return &p, nil
}

// FindNearbyEligibleRiders uses PostGIS ST_DWithin on 4326 geography points (docs/DATABASE.md)
func (ps *PostgresStore) FindNearbyEligibleRiders(ctx context.Context, lat, lng float64, radiusKm float64, limit int) ([]*models.RiderProfile, error) {
	radiusMeters := radiusKm * 1000.0
	query := `SELECT rp.user_id, rp.display_name, rp.verification_status, rp.account_status, rp.created_at, rp.updated_at 
	          FROM rider_profiles rp
	          JOIN rider_presence pres ON pres.rider_id = rp.user_id
	          JOIN rider_locations loc ON loc.rider_id = rp.user_id
	          JOIN rider_subscriptions sub ON sub.rider_id = rp.user_id
	          WHERE rp.verification_status = 'approved'
	            AND rp.account_status = 'active'
	            AND pres.is_online = true
	            AND pres.last_heartbeat_at >= now() - INTERVAL '5 minutes'
	            AND (sub.status IN ('trial', 'active') AND sub.expires_at > now())
	            AND ST_DWithin(loc.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
	            AND NOT EXISTS (
	              SELECT 1 FROM trips t 
	              WHERE t.rider_id = rp.user_id 
	                AND t.status IN ('assigned', 'arriving', 'arrived', 'in_progress')
	            )
	          ORDER BY ST_Distance(loc.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) ASC
	          LIMIT $4`

	rows, err := ps.db.QueryContext(ctx, query, lng, lat, radiusMeters, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var riders []*models.RiderProfile
	for rows.Next() {
		var r models.RiderProfile
		if err := rows.Scan(&r.UserID, &r.DisplayName, &r.VerificationStatus, &r.AccountStatus, &r.CreatedAt, &r.UpdatedAt); err != nil {
			return nil, err
		}
		r.Rating = 4.95
		riders = append(riders, &r)
	}
	return riders, nil
}

func (ps *PostgresStore) GetActivePricingRule(ctx context.Context) (*models.PricingRule, error) {
	query := `SELECT id, currency, base_fare_minor, per_km_minor, per_min_minor, min_fare_minor, version, active, created_at 
	          FROM pricing_rules WHERE active = true LIMIT 1`
	var pr models.PricingRule
	err := ps.db.QueryRowContext(ctx, query).Scan(
		&pr.ID, &pr.Currency, &pr.BaseFareMinor, &pr.PerKmMinor, &pr.PerMinMinor, &pr.MinFareMinor, &pr.Version, &pr.Active, &pr.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	return &pr, err
}

func (ps *PostgresStore) CreatePricingRule(ctx context.Context, pr *models.PricingRule) error {
	tx, err := ps.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if pr.Active {
		if _, err := tx.ExecContext(ctx, `UPDATE pricing_rules SET active = false WHERE active = true`); err != nil {
			return err
		}
	}

	query := `INSERT INTO pricing_rules (id, currency, base_fare_minor, per_km_minor, per_min_minor, min_fare_minor, version, active, created_at) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
	if _, err := tx.ExecContext(ctx, query, pr.ID, pr.Currency, pr.BaseFareMinor, pr.PerKmMinor, pr.PerMinMinor, pr.MinFareMinor, pr.Version, pr.Active, pr.CreatedAt); err != nil {
		return err
	}
	return tx.Commit()
}

func (ps *PostgresStore) ListPricingRules(ctx context.Context) ([]*models.PricingRule, error) {
	rows, err := ps.db.QueryContext(ctx, `SELECT id, currency, base_fare_minor, per_km_minor, per_min_minor, min_fare_minor, version, active, created_at 
	                                     FROM pricing_rules ORDER BY version DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rules []*models.PricingRule
	for rows.Next() {
		var pr models.PricingRule
		if err := rows.Scan(&pr.ID, &pr.Currency, &pr.BaseFareMinor, &pr.PerKmMinor, &pr.PerMinMinor, &pr.MinFareMinor, &pr.Version, &pr.Active, &pr.CreatedAt); err != nil {
			return nil, err
		}
		rules = append(rules, &pr)
	}
	return rules, nil
}

func (ps *PostgresStore) CreateFareQuote(ctx context.Context, q *models.FareQuote) error {
	query := `INSERT INTO fare_quotes (id, passenger_id, pickup_lat, pickup_lng, dest_lat, dest_lng, distance_meters, duration_seconds, currency, fare_minor, expires_at, created_at) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`
	_, err := ps.db.ExecContext(ctx, query, q.ID, q.PassengerID, q.Pickup.Latitude, q.Pickup.Longitude, q.Destination.Latitude, q.Destination.Longitude, q.DistanceMeters, q.DurationSeconds, q.Currency, q.FareMinor, q.ExpiresAt, q.CreatedAt)
	return err
}

func (ps *PostgresStore) GetFareQuote(ctx context.Context, quoteID string) (*models.FareQuote, error) {
	query := `SELECT id, passenger_id, pickup_lat, pickup_lng, dest_lat, dest_lng, distance_meters, duration_seconds, currency, fare_minor, expires_at, created_at 
	          FROM fare_quotes WHERE id = $1`
	var q models.FareQuote
	err := ps.db.QueryRowContext(ctx, query, quoteID).Scan(
		&q.ID, &q.PassengerID, &q.Pickup.Latitude, &q.Pickup.Longitude, &q.Destination.Latitude, &q.Destination.Longitude, &q.DistanceMeters, &q.DurationSeconds, &q.Currency, &q.FareMinor, &q.ExpiresAt, &q.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	return &q, err
}

func (ps *PostgresStore) CreateTrip(ctx context.Context, t *models.Trip) error {
	query := `INSERT INTO trips (id, passenger_id, status, pickup_address, dest_address, fare_minor, currency, created_at, updated_at) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
	_, err := ps.db.ExecContext(ctx, query, t.ID, t.PassengerID, t.Status, t.PickupAddress, t.DestAddress, t.FareMinor, t.Currency, t.CreatedAt, t.UpdatedAt)
	return err
}

func (ps *PostgresStore) GetTripByID(ctx context.Context, tripID string) (*models.Trip, error) {
	query := `SELECT id, passenger_id, rider_id, fare_quote_id, status, pickup_address, dest_address, fare_minor, currency, created_at, updated_at 
	          FROM trips WHERE id = $1`
	var t models.Trip
	var quoteID sql.NullString
	err := ps.db.QueryRowContext(ctx, query, tripID).Scan(
		&t.ID, &t.PassengerID, &t.RiderID, &quoteID, &t.Status, &t.PickupAddress, &t.DestAddress, &t.FareMinor, &t.Currency, &t.CreatedAt, &t.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if quoteID.Valid {
		t.FareQuoteID = quoteID.String
	}
	return &t, nil
}

func (ps *PostgresStore) UpdateTripStatus(ctx context.Context, tripID, status, actorID string, meta map[string]any) error {
	tx, err := ps.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var currentStatus string
	if err := tx.QueryRowContext(ctx, `SELECT status FROM trips WHERE id = $1 FOR UPDATE`, tripID).Scan(&currentStatus); err != nil {
		if err == sql.ErrNoRows {
			return ErrNotFound
		}
		return err
	}

	if _, err := tx.ExecContext(ctx, `UPDATE trips SET status = $1, updated_at = now() WHERE id = $2`, status, tripID); err != nil {
		return err
	}

	queryEv := `INSERT INTO trip_events (trip_id, actor_id, from_status, to_status, metadata, created_at) 
	            VALUES ($1, $2, $3, $4, '{}'::jsonb, now())`
	if _, err := tx.ExecContext(ctx, queryEv, tripID, actorID, currentStatus, status); err != nil {
		return err
	}

	return tx.Commit()
}

func (ps *PostgresStore) AssignTripToRider(ctx context.Context, tripID, riderID string) error {
	tx, err := ps.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var currentStatus string
	var currentRider sql.NullString
	err = tx.QueryRowContext(ctx, `SELECT status, rider_id FROM trips WHERE id = $1 FOR UPDATE`, tripID).Scan(&currentStatus, &currentRider)
	if err == sql.ErrNoRows {
		return ErrNotFound
	}
	if err != nil {
		return err
	}

	if currentRider.Valid || currentStatus == models.TripStatusAssigned {
		return ErrTripAlreadyAssigned
	}

	_, err = tx.ExecContext(ctx, `UPDATE trips SET rider_id = $1, status = 'assigned', updated_at = now() WHERE id = $2`, riderID, tripID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (ps *PostgresStore) ListTrips(ctx context.Context, passengerID, riderID, status string) ([]*models.Trip, error) {
	query := `SELECT id, passenger_id, rider_id, status, pickup_address, dest_address, fare_minor, currency, created_at, updated_at 
	          FROM trips WHERE 1=1`
	var args []any
	argIdx := 1
	if passengerID != "" {
		query += fmt.Sprintf(" AND passenger_id = $%d", argIdx)
		args = append(args, passengerID)
		argIdx++
	}
	if riderID != "" {
		query += fmt.Sprintf(" AND rider_id = $%d", argIdx)
		args = append(args, riderID)
		argIdx++
	}
	if status != "" {
		query += fmt.Sprintf(" AND status = $%d", argIdx)
		args = append(args, status)
		argIdx++
	}
	query += " ORDER BY created_at DESC"

	rows, err := ps.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var trips []*models.Trip
	for rows.Next() {
		var t models.Trip
		if err := rows.Scan(&t.ID, &t.PassengerID, &t.RiderID, &t.Status, &t.PickupAddress, &t.DestAddress, &t.FareMinor, &t.Currency, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		trips = append(trips, &t)
	}
	return trips, nil
}

func (ps *PostgresStore) GetActiveTripForUser(ctx context.Context, userID, role string) (*models.Trip, error) {
	query := `SELECT id, passenger_id, rider_id, status, pickup_address, dest_address, fare_minor, currency, created_at, updated_at 
	          FROM trips 
	          WHERE status IN ('requested', 'searching', 'assigned', 'arriving', 'arrived', 'in_progress')`
	if role == models.RolePassenger {
		query += " AND passenger_id = $1 LIMIT 1"
	} else {
		query += " AND rider_id = $1 LIMIT 1"
	}

	var t models.Trip
	err := ps.db.QueryRowContext(ctx, query, userID).Scan(
		&t.ID, &t.PassengerID, &t.RiderID, &t.Status, &t.PickupAddress, &t.DestAddress, &t.FareMinor, &t.Currency, &t.CreatedAt, &t.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	return &t, err
}

func (ps *PostgresStore) CreateTripOffer(ctx context.Context, o *models.TripOffer) error {
	query := `INSERT INTO trip_offers (id, trip_id, rider_id, status, expires_at, created_at) 
	          VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := ps.db.ExecContext(ctx, query, o.ID, o.TripID, o.RiderID, o.Status, o.ExpiresAt, o.CreatedAt)
	return err
}

func (ps *PostgresStore) GetTripOfferByID(ctx context.Context, offerID string) (*models.TripOffer, error) {
	row := ps.db.QueryRowContext(ctx, `SELECT id, trip_id, rider_id, status, expires_at, created_at FROM trip_offers WHERE id = $1`, offerID)
	var o models.TripOffer
	if err := row.Scan(&o.ID, &o.TripID, &o.RiderID, &o.Status, &o.ExpiresAt, &o.CreatedAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &o, nil
}

func (ps *PostgresStore) GetActiveOfferForRider(ctx context.Context, riderID string) (*models.TripOffer, error) {
	query := `SELECT id, trip_id, rider_id, status, expires_at, created_at 
	          FROM trip_offers 
	          WHERE rider_id = $1 AND status = 'dispatched' AND expires_at > now() 
	          ORDER BY created_at DESC LIMIT 1`
	var o models.TripOffer
	err := ps.db.QueryRowContext(ctx, query, riderID).Scan(&o.ID, &o.TripID, &o.RiderID, &o.Status, &o.ExpiresAt, &o.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	return &o, err
}

func (ps *PostgresStore) UpdateOfferStatus(ctx context.Context, offerID, status string) error {
	_, err := ps.db.ExecContext(ctx, `UPDATE trip_offers SET status = $1 WHERE id = $2`, status, offerID)
	return err
}

func (ps *PostgresStore) ListTripEvents(ctx context.Context, tripID string) ([]*models.TripEvent, error) {
	rows, err := ps.db.QueryContext(ctx, `SELECT id, trip_id, actor_id, from_status, to_status, created_at FROM trip_events WHERE trip_id = $1 ORDER BY created_at ASC`, tripID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []*models.TripEvent
	for rows.Next() {
		var ev models.TripEvent
		var from sql.NullString
		if err := rows.Scan(&ev.ID, &ev.TripID, &ev.ActorID, &from, &ev.ToStatus, &ev.CreatedAt); err != nil {
			return nil, err
		}
		if from.Valid {
			ev.FromStatus = from.String
		}
		events = append(events, &ev)
	}
	return events, nil
}

func (ps *PostgresStore) RecordTripEvent(ctx context.Context, ev *models.TripEvent) error {
	query := `INSERT INTO trip_events (trip_id, actor_id, from_status, to_status, metadata, created_at) 
	          VALUES ($1, $2, $3, $4, '{}'::jsonb, $5)`
	_, err := ps.db.ExecContext(ctx, query, ev.TripID, ev.ActorID, ev.FromStatus, ev.ToStatus, ev.CreatedAt)
	return err
}

func (ps *PostgresStore) CreateSubscriptionPlan(ctx context.Context, plan *models.SubscriptionPlan) error {
	query := `INSERT INTO subscription_plans (id, code, name, price_minor, currency, period_days, trial_days, active, created_at) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
	_, err := ps.db.ExecContext(ctx, query, plan.ID, plan.Code, plan.Name, plan.PriceMinor, plan.Currency, plan.PeriodDays, plan.TrialDays, plan.Active, plan.CreatedAt)
	return err
}

func (ps *PostgresStore) GetSubscriptionPlanByID(ctx context.Context, planID string) (*models.SubscriptionPlan, error) {
	row := ps.db.QueryRowContext(ctx, `SELECT id, code, name, price_minor, currency, period_days, trial_days, active, created_at FROM subscription_plans WHERE id = $1`, planID)
	var plan models.SubscriptionPlan
	if err := row.Scan(&plan.ID, &plan.Code, &plan.Name, &plan.PriceMinor, &plan.Currency, &plan.PeriodDays, &plan.TrialDays, &plan.Active, &plan.CreatedAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &plan, nil
}

func (ps *PostgresStore) ListSubscriptionPlans(ctx context.Context, activeOnly bool) ([]*models.SubscriptionPlan, error) {
	query := `SELECT id, code, name, price_minor, currency, period_days, trial_days, active, created_at FROM subscription_plans`
	if activeOnly {
		query += ` WHERE active = true`
	}
	rows, err := ps.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var plans []*models.SubscriptionPlan
	for rows.Next() {
		var p models.SubscriptionPlan
		if err := rows.Scan(&p.ID, &p.Code, &p.Name, &p.PriceMinor, &p.Currency, &p.PeriodDays, &p.TrialDays, &p.Active, &p.CreatedAt); err != nil {
			return nil, err
		}
		plans = append(plans, &p)
	}
	return plans, nil
}

func (ps *PostgresStore) GetRiderSubscription(ctx context.Context, riderID string) (*models.RiderSubscription, error) {
	query := `SELECT id, rider_id, plan_id, status, starts_at, expires_at, created_at 
	          FROM rider_subscriptions WHERE rider_id = $1 ORDER BY created_at DESC LIMIT 1`
	var sub models.RiderSubscription
	err := ps.db.QueryRowContext(ctx, query, riderID).Scan(&sub.ID, &sub.RiderID, &sub.PlanID, &sub.Status, &sub.StartsAt, &sub.ExpiresAt, &sub.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	return &sub, err
}

func (ps *PostgresStore) UpsertRiderSubscription(ctx context.Context, sub *models.RiderSubscription) error {
	query := `INSERT INTO rider_subscriptions (id, rider_id, plan_id, status, starts_at, expires_at, created_at) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err := ps.db.ExecContext(ctx, query, sub.ID, sub.RiderID, sub.PlanID, sub.Status, sub.StartsAt, sub.ExpiresAt, sub.CreatedAt)
	return err
}

func (ps *PostgresStore) ListRiderSubscriptions(ctx context.Context) ([]*models.RiderSubscription, error) {
	rows, err := ps.db.QueryContext(ctx, `SELECT id, rider_id, plan_id, status, starts_at, expires_at, created_at FROM rider_subscriptions ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var subs []*models.RiderSubscription
	for rows.Next() {
		var sub models.RiderSubscription
		if err := rows.Scan(&sub.ID, &sub.RiderID, &sub.PlanID, &sub.Status, &sub.StartsAt, &sub.ExpiresAt, &sub.CreatedAt); err != nil {
			return nil, err
		}
		subs = append(subs, &sub)
	}
	return subs, nil
}

func (ps *PostgresStore) CreateSafetyReport(ctx context.Context, rep *models.SafetyReport) error {
	query := `INSERT INTO safety_reports (id, trip_id, reporter_id, category, description, status, created_at) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err := ps.db.ExecContext(ctx, query, rep.ID, rep.TripID, rep.ReporterID, rep.Category, rep.Description, rep.Status, rep.CreatedAt)
	return err
}

func (ps *PostgresStore) GetSafetyReportByID(ctx context.Context, reportID string) (*models.SafetyReport, error) {
	row := ps.db.QueryRowContext(ctx, `SELECT id, trip_id, reporter_id, category, description, status, created_at FROM safety_reports WHERE id = $1`, reportID)
	var rep models.SafetyReport
	var tripID sql.NullString
	if err := row.Scan(&rep.ID, &tripID, &rep.ReporterID, &rep.Category, &rep.Description, &rep.Status, &rep.CreatedAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if tripID.Valid {
		rep.TripID = &tripID.String
	}
	return &rep, nil
}

func (ps *PostgresStore) UpdateSafetyReportStatus(ctx context.Context, reportID, status, notes string) error {
	_, err := ps.db.ExecContext(ctx, `UPDATE safety_reports SET status = $1 WHERE id = $2`, status, reportID)
	return err
}

func (ps *PostgresStore) ListSafetyReports(ctx context.Context, status string) ([]*models.SafetyReport, error) {
	query := `SELECT id, trip_id, reporter_id, category, description, status, created_at FROM safety_reports`
	var args []any
	if status != "" {
		query += " WHERE status = $1"
		args = append(args, status)
	}
	query += " ORDER BY created_at DESC"

	rows, err := ps.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reports []*models.SafetyReport
	for rows.Next() {
		var rep models.SafetyReport
		var tripID sql.NullString
		if err := rows.Scan(&rep.ID, &tripID, &rep.ReporterID, &rep.Category, &rep.Description, &rep.Status, &rep.CreatedAt); err != nil {
			return nil, err
		}
		if tripID.Valid {
			rep.TripID = &tripID.String
		}
		reports = append(reports, &rep)
	}
	return reports, nil
}

func (ps *PostgresStore) RecordAuditLog(ctx context.Context, log *models.AuditLog) error {
	query := `INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, details, ip_address, created_at) 
	          VALUES ($1, $2, $3, $4, $5, '{}'::jsonb, $6, $7)`
	_, err := ps.db.ExecContext(ctx, query, log.ID, log.ActorID, log.Action, log.TargetType, log.TargetID, log.IPAddress, log.CreatedAt)
	return err
}

func (ps *PostgresStore) ListAuditLogs(ctx context.Context, limit int) ([]*models.AuditLog, error) {
	rows, err := ps.db.QueryContext(ctx, `SELECT id, actor_id, action, target_type, target_id, ip_address, created_at FROM audit_logs ORDER BY created_at DESC LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []*models.AuditLog
	for rows.Next() {
		var al models.AuditLog
		var ip sql.NullString
		var actor sql.NullString
		if err := rows.Scan(&al.ID, &actor, &al.Action, &al.TargetType, &al.TargetID, &ip, &al.CreatedAt); err != nil {
			return nil, err
		}
		if ip.Valid {
			al.IPAddress = ip.String
		}
		if actor.Valid {
			al.ActorID = actor.String
		}
		logs = append(logs, &al)
	}
	return logs, nil
}

func (ps *PostgresStore) GetAdminMetrics(ctx context.Context) (map[string]any, error) {
	var totalPassengers, totalRiders, verifiedRiders, pendingVerifications, onlineRiders int
	var activeTrips, completedTrips, cancelledTrips, openIncidents int

	_ = ps.db.QueryRowContext(ctx, `SELECT count(*) FROM passenger_profiles`).Scan(&totalPassengers)
	_ = ps.db.QueryRowContext(ctx, `SELECT count(*) FROM rider_profiles`).Scan(&totalRiders)
	_ = ps.db.QueryRowContext(ctx, `SELECT count(*) FROM rider_profiles WHERE verification_status = 'approved'`).Scan(&verifiedRiders)
	_ = ps.db.QueryRowContext(ctx, `SELECT count(*) FROM rider_profiles WHERE verification_status IN ('pending', 'under_review')`).Scan(&pendingVerifications)
	_ = ps.db.QueryRowContext(ctx, `SELECT count(*) FROM rider_presence WHERE is_online = true AND last_heartbeat_at >= now() - INTERVAL '5 minutes'`).Scan(&onlineRiders)
	_ = ps.db.QueryRowContext(ctx, `SELECT count(*) FROM trips WHERE status IN ('requested', 'searching', 'assigned', 'arriving', 'arrived', 'in_progress')`).Scan(&activeTrips)
	_ = ps.db.QueryRowContext(ctx, `SELECT count(*) FROM trips WHERE status = 'completed'`).Scan(&completedTrips)
	_ = ps.db.QueryRowContext(ctx, `SELECT count(*) FROM trips WHERE status = 'cancelled'`).Scan(&cancelledTrips)
	_ = ps.db.QueryRowContext(ctx, `SELECT count(*) FROM safety_reports WHERE status IN ('open', 'investigating')`).Scan(&openIncidents)

	return map[string]any{
		"total_passengers":      totalPassengers,
		"total_riders":          totalRiders,
		"verified_riders":       verifiedRiders,
		"pending_verifications": pendingVerifications,
		"online_riders":         onlineRiders,
		"active_trips":          activeTrips,
		"completed_trips":       completedTrips,
		"cancelled_trips":       cancelledTrips,
		"subscription_revenue":  0,
		"open_incidents":        openIncidents,
	}, nil
}
