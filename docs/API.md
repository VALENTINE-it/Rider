# Rider — API Specification and Integration Contract

**Version:** 1.0 (draft)  
**Date:** 27 October 2026  
**Status:** Proposed; not yet implemented  
**Related:** `PRD.md`, `ARCHITECTURE.md`, `DATABASE.md`  
**API prefix:** `/api/v1`  
**Stack:** Go backend, React/JavaScript web frontend, PostgreSQL/PostGIS

> This document defines a proposed client/server contract. It does **not** imply endpoints are implemented. Subscription prices, pilot geography, fare policy, and final rider verification requirements remain undecided. Examples are illustrative, not approved production values.

## 1. Purpose, scope, and guiding rules

Rider connects passengers to verified motorbike operators using automatic matching. This contract supports passenger and rider web sessions, administration, immutable fare quotes, trips, location and presence, cash-payment reporting, trial/admin-granted subscription entitlements, safety reporting, and real-time updates. Future native apps will reuse the domain APIs.

**Principles:** backend-authoritative state and money; explicit role and resource authorization; consistent envelopes and errors; idempotent retry-prone mutations; database-backed atomic assignment; short-lived quotes; privacy-minimized location access; resilient recovery after disconnection; versioned and documented breaking changes.

**MVP boundaries:** no production M-Pesa trip collection, no guaranteed background GPS in browsers, no dynamic surge pricing, no confirmed subscription tariffs or trial durations, and no assumption that submitted verification documents meet legal requirements.

## 2. Transport, environments, and formats

- All production traffic uses HTTPS (`wss://` for WebSockets). Development may use localhost HTTP.
- Example origin: `https://app.example.invalid`; example API: `https://api.example.invalid/api/v1` (placeholder domains).
- Requests/responses are UTF-8 JSON (`Content-Type: application/json`) except document upload (`multipart/form-data`).
- Resource identifiers are opaque UUID strings. Timestamps are RFC 3339 in UTC (e.g. `2026-10-27T10:30:00Z`).
- Currency uses ISO 4217 codes; amounts use integer **minor units**, never floating-point values. For KES, `19900` represents KSh 199.00; currency and rounding are determined by approved pricing policy.
- Coordinates are JSON `{ "latitude": -0.0917, "longitude": 34.7680 }`; latitude must be -90..90, longitude -180..180. PostGIS storage uses longitude first when constructing a point.
- Use `Cache-Control: no-store` on authenticated and sensitive responses. Sensitive endpoints must not expose verification files or precise locations to unauthorized users.
- Support `X-Request-ID` in responses for troubleshooting; accept only validated client-supplied IDs or generate one server-side.
- All request bodies are size-limited; unknown security-sensitive fields are rejected. Pagination defaults and maxima are configurable (proposed default 20, maximum 100).

### 2.1 Response envelope

Successful single resource:

```json
{
  "data": { "id": "550e8400-e29b-41d4-a716-446655440000" },
  "meta": { "request_id": "req_123" }
}
```

Successful collection:

```json
{
  "data": [],
  "meta": { "next_cursor": null, "limit": 20, "request_id": "req_123" }
}
```

Error:

```json
{
  "error": {
    "code": "TRIP_ALREADY_ASSIGNED",
    "message": "This trip has already been assigned.",
    "details": []
  },
  "meta": { "request_id": "req_123" }
}
```

Errors must never reveal whether another user's sensitive record exists. Validation `details` can contain `{ "field": "pickup.latitude", "reason": "out_of_range" }` but never secrets.

### 2.2 HTTP statuses and stable error codes

| Status | Meaning | Examples |
|---|---|---|
| 200 | Read/update/action succeeded | `GET /auth/me`, trip state transition |
| 201 | Resource created | Trip, registration, report |
| 202 | Accepted for asynchronous work | Document processing, optional matching kickoff |
| 204 | No response body | Logout, if chosen consistently |
| 400 | Malformed JSON or query | `BAD_REQUEST` |
| 401 | Not authenticated | `UNAUTHENTICATED`, `SESSION_EXPIRED` |
| 403 | Authenticated but forbidden | `FORBIDDEN`, `CSRF_INVALID` |
| 404 | Missing or intentionally concealed resource | `NOT_FOUND` |
| 409 | State/uniqueness conflict | `ACTIVE_TRIP_EXISTS`, `OFFER_EXPIRED`, `TRIP_ALREADY_ASSIGNED` |
| 410 | Permanently invalidated offer or quote, if policy chosen | `QUOTE_EXPIRED` |
| 413 | Upload/body too large | `PAYLOAD_TOO_LARGE` |
| 415 | Unsupported content type | `UNSUPPORTED_MEDIA_TYPE` |
| 422 | Valid JSON but invalid business data | `VALIDATION_FAILED`, `ROUTE_UNAVAILABLE`, `RIDER_NOT_ELIGIBLE` |
| 429 | Rate limit exceeded | `RATE_LIMITED` (include `Retry-After`) |
| 500 | Unexpected error | `INTERNAL_ERROR` |
| 502/503/504 | Dependency unavailable/timeout | `ROUTING_UNAVAILABLE`, `SERVICE_UNAVAILABLE` |

### 2.3 Pagination, filtering, sorting

`GET /trips?limit=20&cursor=<opaque>&state=completed`. Return `next_cursor`; never expose SQL offsets or internal cursor signing material. All filters are allowlisted, authorization is applied **before** pagination, and sorting is stable (`created_at DESC, id DESC`).

## 3. Identity, sessions, roles, and CSRF

**Browser auth:** server-generated cryptographically random opaque session token in a `Secure; HttpOnly; SameSite=Lax` (or stricter, deployment-dependent) cookie. Only the token **hash** is stored in the `sessions` table. Cookie path/domain and cross-origin deployment strategy must be finalized before implementation. Prefer same-site deployment; do not use wildcard credentialed CORS. Never put session tokens in localStorage, URLs, or WebSocket query strings.

**CSRF:** for cookie-authenticated state-changing requests, require a server-issued CSRF token in `X-CSRF-Token`, bound to session or protected by a robust double-submit pattern, plus Origin/Referer validation. Bootstrap via `GET /auth/csrf` (authenticated or pre-login as needed). Login/logout and all authenticated mutations must be covered. Frontend sends `credentials: 'include'`.

**Roles:** `passenger`, `rider`, `admin`, `super_admin`; users may have multiple authorized profiles, but each action checks required role and resource ownership. Admin access is separately scoped. Admin login requires MFA for production.

**Phone verification:** verification provider, code expiry, attempt limits, and recovery workflow are pending implementation decisions. The API must not allow unverified phone ownership to authorize production bookings.

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/auth/csrf` | Public/session | Bootstrap CSRF token safely |
| POST | `/auth/register` | Public + CSRF | Create user and selected profile |
| POST | `/auth/verify-phone/request` | Session + CSRF | Request verification challenge |
| POST | `/auth/verify-phone/confirm` | Session + CSRF | Confirm challenge |
| POST | `/auth/login` | Public + CSRF | Create session |
| POST | `/auth/logout` | Session + CSRF | Revoke current session |
| GET | `/auth/me` | Session | Return own identity and roles |
| POST | `/auth/recovery/request` | Public + CSRF | Initiate recovery without account enumeration |
| POST | `/auth/recovery/complete` | Recovery proof + CSRF | Complete recovery and revoke old sessions |

Example login:

```http
POST /api/v1/auth/login
Content-Type: application/json
X-CSRF-Token: <token>

{"phone":"+254700000000","password":"example-not-a-real-password"}
```

```json
{
  "data": {
    "user": {"id":"550e8400-e29b-41d4-a716-446655440000","phone_verified":true,"roles":["passenger"]},
    "session": {"expires_at":"2026-10-28T10:00:00Z"}
  }
}
```

Session cookie is set through `Set-Cookie`, not returned as JSON. All authentication endpoints require abuse throttling and generic failure messaging.

## 4. Profiles, motorbikes, and verification

| Method | Route | Role | Description |
|---|---|---|---|
| GET | `/passenger/profile` | Passenger | Own profile |
| PATCH | `/passenger/profile` | Passenger | Update allowlisted fields |
| GET | `/rider/profile` | Rider | Own profile and verification summary |
| PATCH | `/rider/profile` | Rider | Update allowlisted non-sensitive fields |
| GET | `/rider/motorbikes` | Rider | Own registered motorbikes |
| POST | `/rider/motorbikes` | Rider | Register motorbike (pending review) |
| PATCH | `/rider/motorbikes/{id}` | Rider owner | Edit allowable motorbike details; may reset approval |
| POST | `/rider/documents` | Rider | Upload verification document |
| GET | `/rider/verification` | Rider | Own verification status and required next actions |
| GET | `/admin/rider-applications` | Admin: verification | Pending applications |
| GET | `/admin/riders/{id}/verification` | Admin: verification | Scoped review view |
| POST | `/admin/riders/{id}/approve` | Admin: verification | Approve after required checks |
| POST | `/admin/riders/{id}/reject` | Admin: verification | Reject with reason |
| POST | `/admin/riders/{id}/request-changes` | Admin: verification | Request additional evidence |

Document upload: `multipart/form-data` with `document_type` and `file`; enforce MIME sniffing, size limits, malware scanning as appropriate, private object storage, retention controls, and audit logging. Return only document metadata, never a public file URL. The approved document categories and criteria remain **TBD** after compliance review.

Example verification summary:

```json
{
  "data": {
    "status":"pending_review",
    "submitted_at":"2026-10-27T09:00:00Z",
    "required_actions":[],
    "can_go_online":false
  }
}
```

## 5. Location, presence, and service area

| Method | Route | Role | Description |
|---|---|---|---|
| PUT | `/rider/availability` | Verified eligible rider | Set `desired_online` true/false |
| POST | `/rider/location` | Rider | Send foreground GPS update |
| GET | `/rider/availability` | Rider | Own desired/effective availability and reasons |
| GET | `/service-areas/availability` | Passenger | Check if pickup point is supported, without exposing private rider positions |

Example location update:

```json
{
  "latitude":-0.0917,
  "longitude":34.7680,
  "accuracy_m":18,
  "observed_at":"2026-10-27T10:15:00Z"
}
```

Server records its own receipt timestamp; rejects impossible coordinates, excessively old/future readings, and implausible update rates. An online toggle does **not** guarantee match eligibility: account status, verification, entitlement, active trip, GPS freshness, and service area all apply. Return e.g. `{ "desired_online": true, "effective_online": false, "reason": "LOCATION_STALE" }`. Location visibility is restricted to assigned trips and authorized operational purposes. Never publish a public list of all riders' exact coordinates. Browser background tracking is not guaranteed.

## 6. Fare quotes and booking

**Pricing decisions pending:** no hardcoded fare constants or approved minimums. Quotes are generated only when an active pricing policy exists. Road distance/time comes from a routing provider; straight-line PostGIS distance must not be silently substituted for a road-fare calculation. Quote snapshots are immutable and expire.

### 6.1 Create quote

`POST /trips/estimate` — passenger; may require verified phone and eligible service area.

```json
{
  "pickup":{"latitude":-0.0917,"longitude":34.7680,"label":"Pickup landmark"},
  "destination":{"latitude":-0.0750,"longitude":34.7820,"label":"Destination landmark"}
}
```

```json
{
  "data": {
    "quote_id":"c1baf0c8-6884-4f1b-995a-4a67d11a108a",
    "pickup":{"latitude":-0.0917,"longitude":34.7680},
    "destination":{"latitude":-0.0750,"longitude":34.7820},
    "route":{"distance_m":3600,"duration_s":660},
    "fare":{"amount_minor":19900,"currency":"KES","display":"KSh 199.00"},
    "expires_at":"2026-10-27T10:20:00Z",
    "pricing_version":1
  }
}
```

**All amounts, distances, and timestamps in examples are invented demonstration values.** They do not establish approved fares or an operational service area. API returns `ROUTE_UNAVAILABLE`, `SERVICE_AREA_UNSUPPORTED`, or `PRICING_NOT_CONFIGURED` where appropriate.

### 6.2 Create trip

`POST /trips` — passenger; requires `Idempotency-Key` and a valid quote owned by the passenger.

```http
POST /api/v1/trips
Idempotency-Key: booking-7d70bb93-7f7c-45c4-93d8-c70b7a0f1a40
X-CSRF-Token: <token>
Content-Type: application/json

{"quote_id":"c1baf0c8-6884-4f1b-995a-4a67d11a108a"}
```

```json
{
  "data": {
    "id":"09c3d17b-8791-49a2-8b2d-5b12a54ef178",
    "state":"searching",
    "version":1,
    "fare":{"amount_minor":19900,"currency":"KES"},
    "created_at":"2026-10-27T10:16:00Z"
  }
}
```

The server checks quote ownership, expiration, one-time use, no conflicting active passenger trip, and route/pricing snapshot. One quote may create at most one trip (`trips.quote_id UNIQUE`). Reusing the **same key and payload** returns the original result; same key with different payload yields `409 IDEMPOTENCY_KEY_REUSED`. An idempotency key has a documented retention window; no promise of infinite replay.

### 6.3 Read and cancel trips

| Method | Route | Role | Behavior |
|---|---|---|---|
| GET | `/trips/{id}` | Passenger owner, assigned rider, scoped admin | Authoritative state and version |
| GET | `/passenger/trips` | Passenger | Own trip history with cursor pagination |
| GET | `/rider/trips` | Rider | Own assigned trip history |
| POST | `/trips/{id}/cancel` | Authorized participant | Cancel if transition permitted; reason required |

Cancel example: `{ "reason_code":"plans_changed", "note":"Optional explanation" }`. Cancellation policy and any fees are **TBD**; do not charge by default. Cancellation after `in_progress` follows an exceptional support/safety workflow, not ordinary cancellation.

Trip detail fields: `id`, `state`, `version`, `pickup`, `destination`, `fare`, `created_at`, `assigned_at`, `started_at`, `completed_at`, and, when authorized, a minimized `rider`/`motorbike` summary. A passenger sees only their trip; an offered rider sees limited offer data until assignment.

## 7. Matching and trip offers

**Matching is automatic.** PostGIS finds candidates within a configurable radius, filtered by active account, approved verification, valid subscription/trial entitlement, online status, fresh location, service-area coverage, and no conflicting active trip. Road ETA can rerank shortlisted candidates when provider access permits. Search radius, timeout, retry budget, and ranking weights remain configurable.

| Method | Route | Role | Behavior |
|---|---|---|---|
| GET | `/rider/offers` | Rider | Pending offers for current rider |
| GET | `/rider/offers/{id}` | Offered rider | Own offer details and expiry |
| POST | `/trip-offers/{id}/accept` | Offered rider | Atomically claim trip; idempotency required |
| POST | `/trip-offers/{id}/reject` | Offered rider | Reject pending offer; idempotent |

Offer example:

```json
{
  "data": {
    "id":"f40c03db-9d49-4cb7-83c8-8dddf73a9b24",
    "trip_id":"09c3d17b-8791-49a2-8b2d-5b12a54ef178",
    "status":"pending",
    "pickup":{"latitude":-0.0917,"longitude":34.7680},
    "destination":{"latitude":-0.0750,"longitude":34.7820},
    "fare":{"amount_minor":19900,"currency":"KES"},
    "expires_at":"2026-10-27T10:16:30Z"
  }
}
```

**Acceptance algorithm:** start database transaction; lock trip and rider availability rows in a consistent order; validate offer pending and unexpired, trip still searching, rider still eligible and free; update offer to accepted, trip to assigned, reserve rider, append trip event and outbox event; commit; only then publish. Partial unique indexes in `DATABASE.md` enforce one accepted offer per trip and one active assigned trip per rider. Return `409 OFFER_EXPIRED`, `TRIP_ALREADY_ASSIGNED`, or `RIDER_BUSY` for races. Never assign from a WebSocket message alone.

## 8. Trip lifecycle and allowed actions

Canonical states from `DATABASE.md`:

`requested → searching → assigned → rider_arriving → rider_arrived → in_progress → completed`

Terminal alternatives: `cancelled`, `no_rider_available`. `rider_arriving` may be entered automatically immediately after assignment; every transition must be defined explicitly in implementation.

| Method | Route | Actor | Preconditions / outcome |
|---|---|---|---|
| POST | `/trips/{id}/arriving` | Assigned rider/system | `assigned → rider_arriving` |
| POST | `/trips/{id}/arrive` | Assigned rider | `rider_arriving → rider_arrived` |
| POST | `/trips/{id}/start` | Assigned rider | `rider_arrived → in_progress`; passenger confirmation mechanism **TBD** |
| POST | `/trips/{id}/complete` | Assigned rider | `in_progress → completed` |
| POST | `/trips/{id}/cancel` | Authorized actor | Allowed pre-trip states only, per policy |

For compatibility with `ARCHITECTURE.md`, `/trips/{id}/arriving` is an explicit proposed addition. It can instead be a server-generated transition if no client action is needed; settle before OpenAPI freeze.

Example state response:

```json
{
  "data": {
    "id":"09c3d17b-8791-49a2-8b2d-5b12a54ef178",
    "state":"rider_arrived",
    "version":5,
    "updated_at":"2026-10-27T10:24:00Z"
  }
}
```

Mutations require CSRF protection and server authorization; retry-prone actions use idempotency keys. Invalid transitions return `409 INVALID_TRIP_STATE`. Each accepted transition records `trip_events` and increments a monotonic trip version. Do not allow a completed trip to be reopened by ordinary clients. Subscription expiry during an ongoing trip must not block completion.

## 9. Cash trip payment recording and ratings

| Method | Route | Role | Purpose |
|---|---|---|---|
| POST | `/trips/{id}/payments/cash-report` | Assigned rider | Record claimed receipt of cash after trip completion |
| GET | `/trips/{id}/payments` | Trip participants, scoped admin | Authorized payment state |
| POST | `/trips/{id}/payments/dispute` | Passenger or rider | Report disagreement |
| POST | `/trips/{id}/ratings` | Authorized trip participant | Rate completed trip, once per actor/subject |
| GET | `/rider/earnings` | Rider | Aggregated own recorded fares and payment states |

Cash-report example: `{ "amount_minor": 19900, "currency":"KES" }`; response `status: "reported_paid"`, **not** `confirmed` unless a separate verification mechanism exists. The system must not treat direct rider cash as platform-collected revenue. Amount must match authorized fare unless a documented adjustment exists. Earnings reports distinguish total agreed fares, rider-reported collections, and disputed amounts. Ratings have validated score range (proposed 1–5), with anti-duplication and moderation policy.

## 10. Subscription and entitlement APIs

| Method | Route | Role | Purpose |
|---|---|---|---|
| GET | `/subscription-plans` | Rider | Publicly available active plans (may be empty until policy approved) |
| GET | `/rider/subscription` | Rider | Own current entitlement and expiry |
| GET | `/rider/subscriptions` | Rider | Historical entitlements |
| GET | `/admin/subscriptions` | Subscription admin | Search and review |
| POST | `/admin/riders/{id}/entitlements` | Privileged admin | Audited trial/admin grant under approved policy |
| POST | `/admin/subscriptions/{id}/suspend` | Privileged admin | Suspend with reason |

Example entitlement:

```json
{
  "data": {
    "status":"active",
    "source":"admin_adjustment",
    "starts_at":"2026-10-27T00:00:00Z",
    "expires_at":"2026-11-03T00:00:00Z",
    "eligible_for_new_offers":true
  }
}
```

Dates are illustrative. **No prices, durations, trial eligibility, grace periods, or renewal rules are finalized.** Admin grants require explicit permissions, a reason, and audit trail. Entitlement eligibility is checked transactionally at assignment. Subscription payment endpoints and provider callbacks will be specified separately before live billing; do not fake payment success in the MVP.

## 11. Administration, safety, and audit

| Method | Route | Permission | Purpose |
|---|---|---|---|
| GET | `/admin/dashboard` | `dashboard:read` | Aggregated counts and operational indicators |
| GET | `/admin/users` | `users:read` | Search users with privacy restrictions |
| POST | `/admin/users/{id}/suspend` | `users:suspend` | Suspend with reason and audit |
| GET | `/admin/riders` | `riders:read` | Rider list and verification status |
| GET | `/admin/trips` | `trips:read` | Scoped trip search |
| GET | `/admin/trips/{id}` | `trips:read` | Trip detail and event timeline |
| GET | `/admin/pricing` | `pricing:read` | Current and historical pricing rules |
| POST | `/admin/pricing` | `pricing:write` | Create versioned **inactive** pricing rule |
| POST | `/admin/pricing/{id}/activate` | `pricing:activate` | Activate after approved business decision |
| GET | `/admin/safety-reports` | `safety:read` | Restricted incident queue |
| PATCH | `/admin/safety-reports/{id}` | `safety:manage` | Update status/notes with audit |
| GET | `/admin/audit-logs` | `audit:read` | Restricted searchable audit events |
| POST | `/safety-reports` | Signed-in passenger/rider | Submit report, optionally linked to own trip |
| GET | `/safety-reports/{id}` | Reporter or scoped safety admin | Read own/authorized report |

Example safety report:

```json
{
  "trip_id":"09c3d17b-8791-49a2-8b2d-5b12a54ef178",
  "category":"unsafe_driving",
  "description":"Example report description"
}
```

Reports may also be filed without a trip ID when policy permits. Apply strict access controls and redaction; avoid broadcasting safety reports over general-purpose trip sockets. Admin audit entries include actor, action, resource, time, request ID, and non-sensitive change summary. Sensitive identity documents require separate access logging.

## 12. Real-time WebSocket contract

**Endpoint (proposed):** `GET /api/v1/ws` upgraded to WebSocket using the existing session cookie. Verify `Origin`, session, role, and channel authorization at connection and on subscription changes. For CSRF-sensitive socket commands, prefer a short-lived, session-bound one-time connection ticket obtained through a CSRF-protected HTTPS request, or make sockets strictly read-only and perform all mutations through REST. **MVP recommendation: sockets are read-only event delivery.**

Server event envelope:

```json
{
  "event_id":"e79fdd6c-0382-48a0-85b5-04e90f7bd9c1",
  "type":"trip.state_changed",
  "trip_id":"09c3d17b-8791-49a2-8b2d-5b12a54ef178",
  "version":5,
  "occurred_at":"2026-10-27T10:24:00Z",
  "payload":{"state":"rider_arrived"}
}
```

Proposed event types: `trip.state_changed`, `trip.assigned`, `trip.cancelled`, `offer.created`, `offer.expired`, `rider.location_updated` (authorized active trip only), `subscription.changed`, `notification.created`.

**Delivery semantics:** at-least-once *attempt* via transactional outbox, but clients must assume messages can be missed, duplicated, delayed, or reordered. Deduplicate by `event_id`, compare resource `version`, and on reconnect fetch `GET /trips/{id}`, `GET /rider/offers`, and `GET /rider/availability`. Heartbeats and stale presence are server-enforced. No private GPS broadcast beyond assigned parties and authorized operations. A mobile app will need a separate background tracking/notification design.

## 13. Idempotency, transactions, and concurrency

Require `Idempotency-Key` for trip creation, offer acceptance, trip completion, entitlement grants, and later payment initiation. Scope keys to authenticated actor and operation; store a normalized request hash and the prior response/status; enforce uniqueness in `idempotency_keys`. Same key + same payload returns the original outcome; same key + changed payload returns `409`. Server should publish state changes **after** DB commit through `outbox_events`.

**Critical invariants:**

1. One active trip per passenger; one assigned active trip per rider.
2. One accepted offer per trip; pending offers cannot be accepted after expiry.
3. Quote belongs to passenger and can only be consumed once.
4. Rider eligibility rechecked inside assignment transaction.
5. Trip transition and `trip_events` insert commit together.
6. Subscription/payment states cannot be forged by frontend requests.
7. Outbox and retry workers are safe to execute multiple times.

## 14. Validation, security, and abuse controls

- Validate phone in E.164, UUIDs, coordinate ranges, timestamps, money units, enum values, string lengths, and file metadata.
- Use parameterized SQL, server-side ownership checks, minimum privileges, strict credentialed CORS, TLS, secure cookies, CSRF defenses, session rotation on privilege change, rate limiting, and MFA for administrators.
- Limit authentication attempts, verification-code issuance, trip creation, fare estimates, location updates, and uploads; use differentiated per-user/IP/device limits where appropriate.
- Do not expose raw database errors, full document URLs, other users' phone numbers, or detailed location history.
- Verify provider webhooks with provider-specific signatures/credentials, replay protection, transaction uniqueness, and reconciliation; do not trust an unverified callback.
- Collect only required data; define location/document retention and deletion rules after privacy/legal review.
- Log request IDs, outcomes, duration, and security events, but not session tokens, full GPS trails, passwords, or uploaded documents.

## 15. Observability, health, and operational behavior

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/health/live` | Infrastructure only or tightly scoped | Process liveness |
| GET | `/health/ready` | Infrastructure only or tightly scoped | Dependency readiness |

Health routes are **outside** `/api/v1` by design. Collect P50/P95/P99 latency, HTTP error rates, booking failures, matching duration, offer expiration, DB pool pressure, outbox lag, socket reconnects, and provider timeouts. Use structured logs and correlation IDs. Set bounded upstream timeouts; use `503` for degraded dependencies rather than fabricating prices or bookings.

## 16. Frontend integration patterns

Example React-side API wrapper (illustrative):

```javascript
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export async function apiRequest(path, { method = 'GET', body, csrfToken, idempotencyKey } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) return null;
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error?.message ?? 'Request failed');
    error.code = result.error?.code;
    error.status = response.status;
    throw error;
  }
  return result.data;
}
```

Production client must bootstrap CSRF before mutations, handle expired sessions, `Retry-After`, cancellation via `AbortController`, transient network failures, and socket reconnect reconciliation. Do not auto-retry non-idempotent mutations without a stable idempotency key.

## 17. API testing and acceptance criteria

**Contract tests:** required fields, enums, error envelopes, status codes, pagination, date formats, minor-unit money, invalid coordinates, quote expiry, and unknown fields.

**Authorization tests:** passenger cannot read another passenger's trip; unassigned rider cannot view private trip data; rider cannot approve verification; ordinary admin cannot activate pricing without permission; document access restricted.

**Concurrency tests:** two riders accept simultaneously (exactly one wins); duplicate create-trip requests; stale offer acceptance; rider goes offline while matching; subscription expires mid-trip (trip can finish); cancellation races with acceptance.

**Resilience tests:** routing provider timeout, DB retry, outbox replay, socket disconnect, stale GPS, duplicate callback, duplicate payment-report submission, rate limiting.

**Security tests:** CSRF, session fixation/rotation, cookie attributes, CORS, SQL injection, IDOR, upload abuse, brute-force throttling, private data leakage, MFA enforcement.

**Exit criteria:** every MVP endpoint has documented authorization, request/response schema, validation, errors, idempotency policy, audit expectations, and automated integration coverage before production pilot.

## 18. Open decisions and contract freeze checklist

| ID | Pending decision | Impact |
|---|---|---|
| API-OD-01 | Subscription tariffs, periods, trials, grace rules | Plan payloads and entitlement issuance |
| API-OD-02 | Pilot city/service area | Service-area validation and map coverage |
| API-OD-03 | Fare formula, rounding, cancellation fees | Quote fields and adjustment workflow |
| API-OD-04 | Rider verification and compliance policy | Document types, approvals, eligibility |
| API-OD-05 | Passenger trip-start confirmation (PIN/QR/manual) | `/trips/{id}/start` payload and authorization |
| API-OD-06 | Routing/geocoding provider | Route response metadata and failure handling |
| API-OD-07 | SMS/OTP provider and auth recovery | Verification delivery and limits |
| API-OD-08 | Cash reporting vs digital trip payments | Trip payment reconciliation |
| API-OD-09 | Matching timeout, radius, and fallback ranking | Offer expiry and candidate algorithm |
| API-OD-10 | Web app domains, cookie policy, and CSRF implementation | Deployment/session integration |
| API-OD-11 | File storage and document retention | Verification uploads and deletion |
| API-OD-12 | Event stream replay/notification strategy | Real-time recovery semantics |

**Before coding handlers:** reconcile all endpoint names with `ARCHITECTURE.md` and `PRD.md`, produce machine-readable OpenAPI 3.1 YAML from this document, generate contract tests, and explicitly approve remaining contract-changing decisions. This document is the proposed normative API contract once reviewed; `DATABASE.md` remains the source of truth for currently proposed persistence fields.

---

**Document owner:** Rider project  
**Next recommended document:** `SECURITY.md`, followed by `TEST_PLAN.md` and `TASKS.md`.
