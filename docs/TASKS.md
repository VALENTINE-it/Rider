# Rider — Implementation Task Tracker

**Version:** 1.0  
**Date:** 28 October 2026  
**Status:** Planning baseline; no implementation tasks are marked complete  
**Product:** Subscription-based motorbike ride-hailing web platform  
**Stack:** React + JavaScript + Vite; Go; PostgreSQL + PostGIS; WebSockets  
**Related documents:** `PRD.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `SECURITY.md`, `TEST_PLAN.md`

> **Important:** This tracker is an implementation plan, not evidence that features have been built or tested. Confirm endpoint names, database entities, and conventions against the approved versions of the referenced documents before coding. Four business decisions remain intentionally deferred: subscription pricing, pilot location, fare policy, and rider verification requirements.

## 1. Working agreement

- Build a **responsive web MVP first**; native Android/iOS apps are later phases.
- Use a **modular Go monolith** and a shared, versioned REST API (`/api/v1`), with WebSockets for live active-session events.
- Keep business rules on the backend; React must not be the source of truth for prices, eligibility, payments, or trip state.
- Use small, reviewable pull requests; each task should include tests and documentation updates where applicable.
- No live passenger trips until safety, regulatory, insurance, privacy, and operational readiness are verified.
- Prefer explicit error handling, observability, and safe retries over premature complexity.

### Status legend

- `[ ]` Not started
- `[x]` Completed **only after** the acceptance criteria are verified
- `BLOCKED` Waiting on a dependency or decision
- `P0` Required for MVP/pilot safety or correctness; `P1` important for MVP quality; `P2` later improvement

### Definition of Done (applies to every implementation task)

- [ ] Code is reviewed (self-review acceptable for solo development) and committed.
- [ ] Automated tests relevant to the change pass.
- [ ] Failure and permission-denied paths are handled.
- [ ] No secrets, tokens, or personal documents are committed.
- [ ] API/schema changes are reflected in the appropriate docs and migrations.
- [ ] Manual acceptance criteria are demonstrated on a mobile-sized browser where relevant.
- [ ] Logs and metrics do not expose sensitive data.

---

## 2. Milestones and dependency map

| Milestone | Goal | Prerequisites | Exit gate |
|---|---|---|---|
| M0 | Confirm engineering baseline | Existing documents | Repository conventions and open decisions documented |
| M1 | Development foundation | M0 | Local React, Go, Postgres/PostGIS running; CI green |
| M2 | Identity and roles | M1 | Auth, sessions, RBAC, user profiles tested |
| M3 | Rider onboarding | M2 | Documents securely handled; approval gate enforced |
| M4 | Geolocation and pricing | M2 | Routing, fresh locations, estimate API tested |
| M5 | Booking and matching | M3, M4 | Exactly-one assignment, correct state machine |
| M6 | Rider/passenger UX | M5 | Complete simulated ride from request to completion |
| M7 | Subscription/payment foundation | M2, M5 | Eligibility gates, audit trails, no fake payment success |
| M8 | Admin, safety, observability | M3–M7 | Support and incident workflows functional |
| M9 | Hardening and pilot readiness | M1–M8 | Security, load, field, compliance gates pass |

**Critical path:** M0 → M1 → M2 → (M3 + M4) → M5 → M6 → M8 → M9. M7 can proceed in parallel after identity is stable, but access enforcement must be integrated before pilot.

---

## 3. M0 — Product/engineering baseline

**Priority:** P0  
**Deliverable:** Approved implementation baseline and documented assumptions.

- [ ] **RDR-001** Review PRD, architecture, database, API, security, and test plan for conflicting terminology or contracts.
- [ ] **RDR-002** Choose Go HTTP framework/router and record the decision in `docs/DECISIONS.md` (standard library or a lightweight router are both viable).
- [ ] **RDR-003** Agree on backend module boundaries: auth, users, riders, geo, pricing, trips, matching, subscriptions, payments, admin, safety, notifications.
- [ ] **RDR-004** Define naming conventions, UUID usage, UTC timestamps, JSON field naming, error envelope, pagination, and API versioning.
- [ ] **RDR-005** Decide how a local simulated trip will work without real transport or production payments.
- [ ] **RDR-006** Create an explicit open-decisions register and flag features blocked by pending business policy.
- [ ] **RDR-007** Define the initial pilot go/no-go checklist and identify who can approve it.

**Exit criteria:** No undocumented assumption is required to build M1–M2; unresolved business policies are clearly isolated behind configuration or feature flags.

---

## 4. M1 — Repository and development foundation

**Priority:** P0  
**Dependencies:** M0

### Repository

- [ ] **RDR-101** Initialize Git repository and `main` branch protection/workflow.
- [ ] **RDR-102** Create `/frontend`, `/backend`, `/docs`, `/scripts`, and `.github/workflows`.
- [ ] **RDR-103** Add `.gitignore`, `.editorconfig`, `.env.example`, `README.md`, and contribution/run instructions.
- [ ] **RDR-104** Add developer scripts or Makefile for install, lint, test, migrate, and run.

### Backend and database

- [ ] **RDR-105** Initialize Go module with `cmd/api`, internal modules, configuration, and graceful shutdown.
- [ ] **RDR-106** Add health endpoints (`/health/live`, `/health/ready`) with database readiness checks.
- [ ] **RDR-107** Start PostgreSQL + PostGIS locally (Docker Compose or documented native installation).
- [ ] **RDR-108** Add versioned SQL migration tooling with up/down policy and migration tests.
- [ ] **RDR-109** Add structured logging, request IDs, safe error mapping, and config validation.
- [ ] **RDR-110** Establish database connection pool and timeouts; no hardcoded credentials.

### Frontend and automation

- [ ] **RDR-111** Initialize React + JavaScript + Vite frontend.
- [ ] **RDR-112** Add routing, layout shells for passenger/rider/admin, and a small design-token system.
- [ ] **RDR-113** Create typed-by-convention API client with request cancellation, credentials, error handling, and CSRF support.
- [ ] **RDR-114** Configure frontend linting, formatting, and component test runner.
- [ ] **RDR-115** Configure Go unit/integration test commands and CI workflow.
- [ ] **RDR-116** Add seed data for **fictional** users/riders/locations; never use real IDs or documents.

**Exit criteria:** A fresh checkout can run frontend, backend, Postgres/PostGIS, migrations, and automated baseline checks following the README.

---

## 5. M2 — Identity, sessions, and role permissions

**Priority:** P0  
**Dependencies:** M1

- [ ] **RDR-201** Create user, passenger profile, rider profile, admin role, and session schema migrations.
- [ ] **RDR-202** Implement registration and secure password hashing (if password authentication is selected).
- [ ] **RDR-203** Implement login, logout, current-user, and session revocation endpoints.
- [ ] **RDR-204** Use Secure/HttpOnly/SameSite cookies in production; implement CSRF protection for state-changing web requests.
- [ ] **RDR-205** Implement role-based authorization middleware and resource ownership checks.
- [ ] **RDR-206** Add rate limits and abuse-safe error messages for authentication.
- [ ] **RDR-207** Design phone verification adapter with a local fake provider; do not assume production SMS credentials.
- [ ] **RDR-208** Implement passenger profile page and protected routes.
- [ ] **RDR-209** Implement admin MFA strategy and require it before production admin access.
- [ ] **RDR-210** Add tests for unauthorized access, session expiry, CSRF, duplicate identities, and role escalation.

**Exit criteria:** A passenger cannot access rider/admin data; rider/admin actions are server-authorized; logout revokes access; no sensitive session values are exposed to JS.

---

## 6. M3 — Rider onboarding and verification workflow

**Priority:** P0  
**Dependencies:** M2  
**Policy note:** Exact document types, approval rules, and regulatory criteria are **BLOCKED** pending rider verification decisions. Build generic workflow only until policy is approved.

- [ ] **RDR-301** Create motorbike, verification document metadata, review history, and status schema.
- [ ] **RDR-302** Implement rider onboarding form with validation and draft/save behavior.
- [ ] **RDR-303** Implement private document upload adapter with file size/type checks, malware-scanning strategy, and access-controlled retrieval.
- [ ] **RDR-304** Build admin review queue with approve/reject/request-more-information actions.
- [ ] **RDR-305** Audit all review actions with actor, reason, timestamp, and status change.
- [ ] **RDR-306** Block unapproved/suspended riders from going online or accepting trips.
- [ ] **RDR-307** Add document retention/deletion controls and least-privilege access.
- [ ] **RDR-308** Test unauthorized document access, upload validation, repeated review requests, and verification state transitions.
- [ ] **RDR-309 — BLOCKED** Finalize production-required rider documents and validation rules after legal/operational review.

**Exit criteria:** A test rider cannot take trips without approval; documents are not public; review history is auditable.

---

## 7. M4 — Location, maps, routing, and fare estimates

**Priority:** P0  
**Dependencies:** M2  
**Policy note:** Final fare amounts and adjustments are **BLOCKED**; implement a configurable pricing engine with illustrative test fixtures.

- [ ] **RDR-401** Add PostGIS `geography(Point, 4326)` rider location schema and GiST index.
- [ ] **RDR-402** Implement authenticated location updates with coordinate validation, timestamp, and freshness rules.
- [ ] **RDR-403** Add online/offline and stale-location eligibility checks; avoid background-GPS assumptions in browsers.
- [ ] **RDR-404** Implement nearby-rider query with `ST_DWithin` and bounded result count.
- [ ] **RDR-405** Integrate map UI with manual pickup selection when geolocation is denied.
- [ ] **RDR-406** Add geocoding/routing provider interface and mock provider for tests.
- [ ] **RDR-407** Calculate road distance and duration from routing response; handle no-route and provider failures.
- [ ] **RDR-408** Implement backend pricing engine using integer money units, minimum fare, versioned rules, and explicit rounding.
- [ ] **RDR-409** Implement fare estimate endpoint with expiry/validity policy and clear estimate response.
- [ ] **RDR-410** Add tests for longitude/latitude order, 3 km radius, stale coordinates, minimum fare, rounding, invalid route, and pricing version.
- [ ] **RDR-411 — BLOCKED** Approve real-world fare rates, cancellation adjustments, and fare-lock policy.

**Exit criteria:** A passenger can select locations and receive a server-calculated *test* fare; geographic queries return only fresh, eligible rider candidates.

---

## 8. M5 — Booking, rider matching, and concurrency

**Priority:** P0  
**Dependencies:** M3, M4

- [ ] **RDR-501** Create trips, trip offers, and trip events tables with constraints and indexes.
- [ ] **RDR-502** Implement `POST /trips` with validation, authenticated ownership, and idempotency key.
- [ ] **RDR-503** Define authoritative trip state machine and legal transitions.
- [ ] **RDR-504** Implement candidate filtering by approved rider, availability, subscription eligibility, freshness, and distance.
- [ ] **RDR-505** Implement bounded sequential offer dispatch with configurable timeout and radius expansion.
- [ ] **RDR-506** Implement atomic accept logic with transaction/locking or compare-and-swap constraints.
- [ ] **RDR-507** Prevent rider double-booking and passenger duplicate active bookings.
- [ ] **RDR-508** Implement reject, expire, cancel, arrive, start, and complete actions with role checks.
- [ ] **RDR-509** Record immutable trip events, agreed fare, and pricing version.
- [ ] **RDR-510** Implement retries that cannot produce duplicate offers, assignments, or state changes.
- [ ] **RDR-511** Test two riders accepting simultaneously, request replay, late acceptance, cancellation races, stale rider location, and no-rider-found cases.

**Exit criteria:** Every booking has at most one confirmed rider; all state changes are authorized and auditable; concurrency tests pass consistently.

---

## 9. M6 — Passenger and rider booking experiences

**Priority:** P0/P1  
**Dependencies:** M5

### Passenger

- [ ] **RDR-601** Build booking page with pickup/destination, route preview, and fare estimate.
- [ ] **RDR-602** Build searching/assigned/no-rider/cancelled states.
- [ ] **RDR-603** Show rider and motorbike identification appropriate to the approved safety policy.
- [ ] **RDR-604** Build trip progress view and clear stale-location indicators.
- [ ] **RDR-605** Build trip history, detail/receipt, and basic rating form.

### Rider

- [ ] **RDR-606** Build rider dashboard and availability toggle.
- [ ] **RDR-607** Build incoming trip offer UI with accept/reject/expiry.
- [ ] **RDR-608** Build pickup, arrival, start, and completion controls.
- [ ] **RDR-609** Build rider trip history and recorded earnings view.

### Real-time

- [ ] **RDR-610** Add authenticated WebSocket connection scoped to current user/trip.
- [ ] **RDR-611** Publish booking offers and trip state changes; authorize every subscription.
- [ ] **RDR-612** Add reconnect behavior and REST re-fetch as source of truth.
- [ ] **RDR-613** Rate-limit location updates; prevent cross-trip event disclosure.
- [ ] **RDR-614** Test complete simulated passenger/rider journey on desktop and low-end mobile browser sizes.

**Exit criteria:** Two browser sessions can complete a simulated trip with accurate state synchronization, even after one session disconnects and reconnects.

---

## 10. M7 — Subscriptions and payment foundations

**Priority:** P0 for access enforcement; P1 for advanced billing  
**Dependencies:** M2, M5  
**Policy note:** Subscription amounts and trial duration are **BLOCKED**. Use configurable plans and non-production fixtures.

- [ ] **RDR-701** Create subscription plans, rider subscriptions, payment attempts, and audit schema.
- [ ] **RDR-702** Implement trial/active/expired/suspended/cancelled access evaluation.
- [ ] **RDR-703** Enforce subscription eligibility at new trip offer/acceptance; do not interrupt trips already underway on expiry.
- [ ] **RDR-704** Build rider subscription status and history UI.
- [ ] **RDR-705** Build admin-only sandbox/manual activation workflow with reason and audit trail.
- [ ] **RDR-706** Record trip cash payment as rider-reported; distinguish from confirmed platform-processed funds.
- [ ] **RDR-707** Add payment provider interface with signed-callback verification and idempotent reconciliation design for future M-Pesa.
- [ ] **RDR-708** Test expiry boundaries, replayed callbacks, forged payment status, duplicate activation, and authorization.
- [ ] **RDR-709 — BLOCKED** Approve plan pricing, trial duration, grace periods, and refunds.
- [ ] **RDR-710 — POST-MVP** Integrate production M-Pesa once commercial and compliance requirements are met.

**Exit criteria:** No unauthorized paid access; subscription records and cash-trip records are not conflated; no fake successful payment states.

---

## 11. M8 — Administration, safety, and operations

**Priority:** P0  
**Dependencies:** M3–M7

- [ ] **RDR-801** Build role-protected admin dashboard with riders, trips, and subscription summaries.
- [ ] **RDR-802** Build rider review, user suspension, and reasoned reinstatement workflows.
- [ ] **RDR-803** Build trip search and detail pages with least-privilege access.
- [ ] **RDR-804** Build versioned pricing configuration UI (publishing actual rates waits for policy approval).
- [ ] **RDR-805** Build passenger/rider safety report submission and admin case management.
- [ ] **RDR-806** Define and document emergency escalation, response ownership, and support hours before pilot.
- [ ] **RDR-807** Add trip-sharing link design with short expiry, limited disclosure, and revocation.
- [ ] **RDR-808** Add audit logs for sensitive admin and financial actions.
- [ ] **RDR-809** Add dashboards/alerts for errors, failed matching, stale locations, queue lag, and database health.
- [ ] **RDR-810** Implement backup schedule and rehearse restoration.
- [ ] **RDR-811** Test least privilege, incident visibility, account suspension during active trip, and audit immutability.

**Exit criteria:** Admins can manage the pilot without direct database edits; safety incidents can be recorded, escalated, and audited.

---

## 12. M9 — Security, performance, deployment, and pilot readiness

**Priority:** P0  
**Dependencies:** M1–M8

### Automated quality gates

- [ ] **RDR-901** Run full Go unit/integration tests and frontend component/end-to-end tests in CI.
- [ ] **RDR-902** Run API contract tests against `API.md` and migration tests against `DATABASE.md`.
- [ ] **RDR-903** Run security checks: session, CSRF, RBAC/IDOR, injection, rate limiting, WebSocket authorization, secrets.
- [ ] **RDR-904** Run concurrency stress tests for accept/cancel/expire races.
- [ ] **RDR-905** Run load tests and measure p50/p95/p99 latency under documented pilot conditions.
- [ ] **RDR-906** Verify error handling during map provider outage, DB restart, WebSocket disconnect, and low connectivity.

### Deployment and field readiness

- [ ] **RDR-907** Provision staging with HTTPS, environment secrets, migrations, logs, metrics, and backups.
- [ ] **RDR-908** Establish deployment rollback and recovery runbook.
- [ ] **RDR-909** Test web app on representative entry-level Android phones and common browsers.
- [ ] **RDR-910** Run closed, simulated field trials using approved test accounts and controlled routes.
- [ ] **RDR-911** Complete privacy notice, retention schedule, and data protection review.
- [ ] **RDR-912 — BLOCKED** Confirm actual pilot location, geographic coverage, and operational support plan.
- [ ] **RDR-913 — BLOCKED** Confirm rider verification, transport, insurance, and other applicable legal requirements.
- [ ] **RDR-914 — BLOCKED** Approve real fares and subscription policy after research.
- [ ] **RDR-915** Review all P0 issues; obtain explicit go/no-go approval before real passenger trips.

**Exit criteria:** No unresolved critical security/safety defects, required compliance preparations completed, successful backup restore, documented performance results, and written approval for the controlled pilot.

---

## 13. Cross-cutting technical requirements

- [ ] **RDR-X01** All money values use integer minor units or exact decimals; never JavaScript floats as the source of truth.
- [ ] **RDR-X02** All business timestamps stored in UTC; user-facing display localized appropriately.
- [ ] **RDR-X03** All write endpoints validate input and enforce actor permissions on the server.
- [ ] **RDR-X04** Critical writes use transactions and/or uniqueness constraints; idempotency is explicit.
- [ ] **RDR-X05** Rider location is time-limited and never exposed outside authorized active-trip contexts.
- [ ] **RDR-X06** Uploaded identity documents use private storage and short-lived authorized access.
- [ ] **RDR-X07** External integrations have timeouts, retries with backoff where safe, and failure fallbacks.
- [ ] **RDR-X08** Monitoring and logs use request IDs but avoid unnecessary personal information.
- [ ] **RDR-X09** Document schema and API breaking changes before implementation.
- [ ] **RDR-X10** Keep web/mobile client independence: no backend behavior tied to React internals.

---

## 14. Deferred business decisions — do not silently assume

| Decision | Current state | Technical handling until approved |
|---|---|---|
| Subscription pricing and plan rules | Deferred | Configurable plan records; sandbox/manual activation only |
| Pilot location and coverage | Deferred | Configurable service polygons/radius; no public geographic claims |
| Fare policy and rates | Deferred | Versioned rate configuration and test-only example values |
| Rider verification requirements | Deferred | Generic document/review workflow; block live trips until approved |

Additional decisions to resolve later: mapping provider and budget, SMS provider, support staffing/hours, cancellation fee policy, trip dispute policy, M-Pesa rollout scope, retention periods, and launch date.

---

## 15. Suggested first development sprint (start here)

**Sprint goal:** A clean, reproducible local development environment; **not** a production booking service.

- [ ] Day 1: RDR-001 through RDR-006 — review contracts, record decisions, choose conventions.
- [ ] Day 2: RDR-101 through RDR-104 — repository skeleton, documentation, scripts.
- [ ] Day 3: RDR-105 through RDR-110 — Go API, health checks, PostgreSQL/PostGIS, migrations.
- [ ] Day 4: RDR-111 through RDR-114 — React/Vite, routing, layout, API client, frontend checks.
- [ ] Day 5: RDR-115 through RDR-116 — CI, tests, fictional seed data, clean-install verification.

These are **illustrative work blocks**, not guaranteed delivery dates. Adjust to available time and obstacles.

### Sprint 1 demo checklist

- [ ] `frontend` starts locally and displays a Rider placeholder landing page.
- [ ] `backend` starts locally and exposes successful liveness/readiness endpoints.
- [ ] PostgreSQL has PostGIS enabled and migrations run from a fresh database.
- [ ] React can call a non-sensitive Go API endpoint through documented configuration.
- [ ] Automated lint/test commands and CI pass.
- [ ] A new developer can reproduce the setup from `README.md`.

---

## 16. Progress log template

Add entries as work happens. Do not pre-mark tasks as complete.

| Date | Task IDs | Result | Evidence (PR/test/demo) | Blockers/next action |
|---|---|---|---|---|
| YYYY-MM-DD | RDR-___ | Not started / In progress / Done | Link or command output | Notes |

## 17. Release readiness sign-off

| Area | Owner | Status |
|---|---|---|
| Product requirements and deferred decisions | Product owner | Pending |
| Technical architecture and API contract | Lead developer | Pending |
| Automated functional testing | Lead developer / QA | Pending |
| Security and privacy review | Qualified reviewer | Pending |
| Transport/insurance/regulatory review | Qualified local adviser | Pending |
| Pilot support and incident response | Operations owner | Pending |
| Pilot go/no-go approval | Product owner | Pending |

**Next action:** Create the repository and execute **M0 → M1**. Do not begin with live payment integrations or production ride matching.
