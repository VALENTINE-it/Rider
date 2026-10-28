# Rider — Test Plan and Quality Assurance Strategy

**Document:** `docs/TEST_PLAN.md`  
**Version:** 1.0 (draft)  
**Date:** 28 October 2026  
**Status:** Proposed — requires review before pilot  
**Product:** Rider, web-first motorbike ride-hailing platform  
**Stack:** React + JavaScript (Vite); Go REST API and WebSockets; PostgreSQL + PostGIS  
**Related documents:** `PRD.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `SECURITY.md`

> **Decision boundaries:** Subscription prices, pilot geography, final fare policy/rates, and rider verification policy remain **TBD**. Test configurable rules, invariants, and policy interfaces now; add concrete acceptance cases after those decisions are approved. This document is a **test specification**, not evidence that tests have run or passed.

---

## 1. Purpose and quality goals

The test program must establish that Rider can safely and consistently perform its central journey: a passenger requests a trip, the backend issues a trustworthy fare quote, an eligible rider is offered and accepts the trip, the trip progresses through authorized states, and both parties see accurate outcomes. Tests must also prove the system behaves correctly under concurrency, connectivity failures, malicious requests, and data errors.

**Primary quality goals:**
1. **Correctness:** No double assignment, impossible trip transitions, unauthorized trip mutations, or fabricated payment confirmations.
2. **Safety and privacy:** Verification and entitlement gates work; precise location and identity documents are access-controlled; safety reporting is usable.
3. **Reliability:** Retry, timeout, reconnect, and restart do not corrupt booking state.
4. **Transparency:** Quotes, trip fares, earnings, and subscription status reflect authoritative server records.
5. **Usability:** Passenger and rider flows work on realistic low-end phones and imperfect networks.
6. **Maintainability:** Automated regression tests run reliably in CI with deterministic fixtures.

### 1.1 Test scope

| In scope for web MVP | Deferred or conditional |
|---|---|
| Auth/session/roles, rider onboarding, policy-controlled verification, locations/presence, quotes, matching, trip offers and state changes, cash recording, subscription entitlements, admin, safety reports, audit, real-time recovery | Native mobile background GPS and push; production M-Pesa settlement until integrated; surge pricing, multi-stop trips, referrals, multi-city rollout |

External providers (SMS, maps/routing, payment callbacks) must be tested using controlled fakes/sandboxes, with limited real-provider integration checks before enabling production use.

## 2. Traceability and ownership

Each requirement shall have at least one test ID and a recorded outcome. Use the PRD's module requirements and the API/SECURITY contracts as the source of truth; when documents conflict, **block release and resolve the contract**, rather than silently changing tests.

| Requirement area | Test suite | Primary owner | Gate |
|---|---|---|---|
| Identity, authorization, CSRF | AUTH, SEC | Backend + QA | Mandatory |
| Rider approval and eligibility | VERIFY, MATCH | Backend + operations | Mandatory |
| Geo presence, nearby discovery | GEO | Backend | Mandatory |
| Fare quote and immutability | FARE | Backend | Mandatory |
| Trip assignment and state machine | MATCH, TRIP, CONC | Backend | Mandatory |
| WebSockets/reconnect | RT | Backend + frontend | Mandatory |
| Cash status, subscription entitlements | PAY, SUB | Backend | Mandatory |
| Admin, incidents, audit | ADMIN, SAFE, AUDIT | Backend + operations | Mandatory |
| Responsive UX/accessibility | UI, A11Y | Frontend | Mandatory |
| Load, recovery, backups | PERF, RES, DB | Engineering | Mandatory before live pilot |
| M-Pesa live payments | MPESA | Engineering + finance | Only when feature enabled |

**Evidence record per test:** ID, requirement reference, environment/build SHA, dataset, steps, expected result, actual result, timestamp, owner, defect link, and proof (sanitized logs/screenshots).

## 3. Environments and test data

| Environment | Purpose | Data and access |
|---|---|---|
| Local | Unit and developer integration | Disposable seeded database, mocked providers |
| CI | Repeatable automated checks | Ephemeral PostgreSQL + PostGIS, isolated jobs |
| Staging | E2E, security, performance rehearsal | Production-like configuration, synthetic users, sandbox integrations |
| Controlled pilot | Real-world operational validation | Authorized real users, minimum necessary data, safety oversight |

- Keep separate secrets, storage buckets, SMS sender IDs, callback URLs, and payment credentials by environment.
- Never run destructive test cases against production or real riders.
- Use generated identities, fictional licence numbers, and test coordinates; do not copy real identity documents into staging.
- Seed deterministic rider states: `pending`, `approved`, `rejected`, `suspended`, `online`, `offline`, `busy`, `stale`, `trial`, `active`, `expired`.
- Use fixed UTC clocks in unit tests, explicit timezone tests for Kenya (`Africa/Nairobi`), and bounded fake GPS movement.
- For concurrency, create multiple independent sessions and connections; do not simulate contention only by calling one handler serially.

## 4. Test pyramid and tooling

**Unit:** Go's `testing` package, table-driven tests, fakes; frontend Vitest + React Testing Library (proposed).  
**Integration:** Go tests against real PostgreSQL/PostGIS in containers, real SQL migrations, mocked external providers.  
**Contract/API:** OpenAPI/schema validation and HTTP status/error-envelope assertions; negative authorization tests.  
**End-to-end:** Playwright on Chromium plus representative mobile viewport; targeted Firefox/WebKit compatibility where practical.  
**Load:** k6 or equivalent against staging; report P50/P95/P99, error rates, throughput, DB pool metrics.  
**Security:** Dependency scans, secret scans, static analysis, access-control matrix tests, manual threat-model review.  
**Accessibility:** Automated axe checks plus manual keyboard/screen-reader verification.

Tools are proposals, not installed dependencies. Avoid flaky time sleeps: use controllable clocks, polling with deadlines, and explicit event acknowledgements.

## 5. Unit test catalog

### 5.1 FARE — quote calculation

| ID | Scenario | Expected |
|---|---|---|
| FARE-001 | Valid route, configured base/distance/time rates | Server returns correct rounded total and currency |
| FARE-002 | Calculated total below configured minimum | Minimum is applied |
| FARE-003 | Zero/negative/NaN/infinite distance or duration | Input rejected or handled per explicit contract; never negative fare |
| FARE-004 | Overflow, large inputs, fractional money | No float drift, overflow, or invalid money value |
| FARE-005 | Price configuration changes after quote | Existing accepted quote uses original pricing version |
| FARE-006 | Quote expires | Booking with expired quote rejected with stable error |
| FARE-007 | Client tampers with quoted price | Backend ignores/rejects client amount |
| FARE-008 | Routing provider unavailable | Clear failure/fallback per approved policy; no invented route/fare |

### 5.2 TRIP — lifecycle

| ID | Scenario | Expected |
|---|---|---|
| TRIP-001 | All permitted state transitions | Authorized transition succeeds and creates timestamped event |
| TRIP-002 | Start trip before assignment/arrival policy | Rejected |
| TRIP-003 | Complete trip twice | Idempotent/no duplicate earnings or event side effects |
| TRIP-004 | Passenger cancels within allowed state | State and cancellation reason recorded |
| TRIP-005 | Unauthorized actor changes trip | Forbidden, no mutation |
| TRIP-006 | Active trip becomes disputed | Incident workflow preserves trip/event history |
| TRIP-007 | Cancellation races with acceptance | Exactly one valid final outcome, no orphan assignment |

### 5.3 SUB — subscriptions

| ID | Scenario | Expected |
|---|---|---|
| SUB-001 | Active/trial rider goes online | Eligible if all other checks pass |
| SUB-002 | Expired/suspended entitlement | Cannot receive *new* trip offer |
| SUB-003 | Subscription expires mid-trip | In-progress trip remains completable |
| SUB-004 | Repeated activation callback/manual action | No duplicated entitlement or payment |
| SUB-005 | Clock boundary and timezone | Expiry evaluated consistently in UTC |
| SUB-006 | Trial re-registration abuse | Controlled per configurable policy |

### 5.4 GEO — geospatial and presence

| ID | Scenario | Expected |
|---|---|---|
| GEO-001 | Point within radius | Included in ST_DWithin result |
| GEO-002 | Point outside radius | Excluded |
| GEO-003 | Coordinates reversed/out of bounds | Validation catches invalid coordinates; documented order longitude, latitude |
| GEO-004 | GPS heartbeat stale | Rider excluded from eligible matching |
| GEO-005 | Offline or busy rider nearby | Excluded |
| GEO-006 | Two riders at same location | Stable deterministic tie-break or fair policy |
| GEO-007 | Geographic boundary / service area | Correct inclusion or exclusion per configured polygon |
| GEO-008 | Straight-line closest differs from road ETA | Selection behavior matches documented routing/ranking policy |

## 6. Integration tests — backend and database

Run against real PostgreSQL with PostGIS enabled, not only mocks.

| ID | Integration scenario | Expected |
|---|---|---|
| DB-001 | Apply all migrations from empty database | Success; expected schema and extensions exist |
| DB-002 | Migrate then roll forward from previous supported version | No data loss; documented rollback/recovery strategy |
| DB-003 | FK/unique/check constraints | Invalid data rejected by database |
| DB-004 | GIST spatial index and nearby rider query | Correct results; inspect query plan at representative scale |
| DB-005 | Transaction rollback on partial trip acceptance failure | No half-assigned trip, rider, or offer |
| DB-006 | Unique active assignment constraints | Database rejects duplicate active allocation |
| DB-007 | Outbox/event publish failure | Durable event available for safe retry |
| DB-008 | Backup and restore rehearsal | Restore validated by integrity queries and sample flows |
| DB-009 | Sensitive documents stored as private references | No public object URL or leaked file contents |
| DB-010 | Historical quotes and payment records | Immutable authoritative values retained after policy changes |

## 7. API and contract tests

Check each endpoint's required role, schema, status code, stable error code, validation behavior, and idempotency behavior against `API.md`.

### 7.1 Authentication and session cases

- **AUTH-001:** Valid registration and phone verification path succeeds; duplicate verified number handled safely.
- **AUTH-002:** Invalid login and repeated failed attempts yield generic errors and rate limits.
- **AUTH-003:** Secure/HttpOnly/SameSite cookie settings verified in staging over HTTPS.
- **AUTH-004:** Logout invalidates server session; old cookie no longer works.
- **AUTH-005:** Session expiry/revocation blocks HTTP and WebSocket access.
- **AUTH-006:** Cross-site state-changing request without valid CSRF token is rejected.
- **AUTH-007:** Session fixation and session rotation after login are tested.
- **AUTH-008:** Password reset/phone recovery cannot be used to take over another account.

### 7.2 Core API cases

- **API-001:** `POST /api/v1/trips/estimate` validates locations, returns quote ID, expiry, pricing version, currency and server amount.
- **API-002:** `POST /api/v1/trips` requires an eligible authenticated passenger and valid quote.
- **API-003:** `GET /api/v1/trips/:id` returns only information authorized for that actor.
- **API-004:** `POST /api/v1/trips/:id/cancel` enforces role and state policy.
- **API-005:** `POST /api/v1/trips/:id/accept` checks offered rider, offer expiry, entitlement and current assignment.
- **API-006:** `POST /api/v1/trips/:id/start` and `/complete` enforce authorized transitions.
- **API-007:** `PATCH /api/v1/rider/availability` requires approved rider and correct session.
- **API-008:** `POST /api/v1/rider/location` rejects invalid or excessive updates and updates freshness correctly.
- **API-009:** Pagination/filtering rejects unsafe or unbounded parameters.
- **API-010:** All errors use documented envelope; internal stack traces and secrets are absent.
- **API-011:** Unknown API version/path returns predictable response; no unintended fallback to frontend HTML.
- **API-012:** Content-type, request size, malformed JSON and duplicate fields follow documented policy.

## 8. Concurrency, matching, and idempotency (critical)

**Release blocker:** a trip must never have two confirmed riders, and a rider must never have two conflicting active trips.

| ID | Concurrent action | Expected invariant |
|---|---|---|
| CONC-001 | Two riders accept same offer/trip simultaneously | Exactly one acceptance committed |
| CONC-002 | Same rider accepts two different trips simultaneously | At most one active trip |
| CONC-003 | Passenger retries create-trip with same idempotency key | One trip created; same logical result returned |
| CONC-004 | Same idempotency key, different payload | Conflict/rejection; no silent reuse |
| CONC-005 | Rider accepts just as offer expires | One deterministic valid result |
| CONC-006 | Passenger cancels while rider accepts | Valid serialized outcome; no ghost assignment |
| CONC-007 | Duplicate start/complete requests under retries | Single state transition and side effects |
| CONC-008 | Worker crashes after DB commit but before notification | Recovery delivers state through outbox/polling without duplicate assignment |
| CONC-009 | 100+ parallel matching attempts for overlapping riders | Invariants hold; performance recorded |

**Method:** use barriers to start goroutines concurrently; assert database rows and constraints after all responses; repeat in CI; run Go race detector for in-memory concurrency; inject faults at transaction and outbox boundaries.

## 9. Real-time and connectivity tests

| ID | Scenario | Expected |
|---|---|---|
| RT-001 | Authorized rider receives matching offer | Correct offer event only to intended rider |
| RT-002 | Unauthorized client subscribes to another trip | Denied; no sensitive event leakage |
| RT-003 | WebSocket drops during active trip | UI shows disconnected/stale status; can recover via REST snapshot |
| RT-004 | Reconnect after missed events | Authoritative trip state restored; no duplicate side effects |
| RT-005 | Events arrive out of order/duplicate | Version/sequence handling prevents state regression |
| RT-006 | Browser tab backgrounded | No assumption of reliable background GPS; stale presence excluded |
| RT-007 | Slow client/backpressure | Bounded queue, graceful disconnect or documented handling |
| RT-008 | Auth expires while socket open | Connection revoked or revalidated promptly |
| RT-009 | Location stream stops | Passenger sees location freshness warning, not false live tracking |

## 10. Payments, subscriptions, and accounting

### 10.1 Cash pilot

- **PAY-001:** Rider reports cash received; record is clearly `reported`, not independently verified.
- **PAY-002:** Passenger disputes cash status; original record and dispute history preserved.
- **PAY-003:** Repeated payment-report request does not double count earnings.
- **PAY-004:** Trip fare appears in rider trip history but **not** platform subscription revenue.
- **PAY-005:** Incomplete/cancelled trip cannot be falsely counted as completed earnings.
- **PAY-006:** Platform fee on trip is always zero in subscription-only model; test that no commission deduction is applied.

### 10.2 Future M-Pesa (conditional gate)

- **MPESA-001:** STK initiation is pending, not success.
- **MPESA-002:** Signed/authenticated provider callback verified according to provider contract.
- **MPESA-003:** Duplicate/out-of-order callbacks are idempotent.
- **MPESA-004:** Payment amount, account and transaction reference reconcile.
- **MPESA-005:** Failed/timeout/reversed payment does not grant incorrect entitlement.
- **MPESA-006:** Sandbox-to-live credentials and endpoints cannot be mixed.

## 11. Rider verification, safety, and admin workflows

Verification tests exercise **configurable states and access restrictions**, not unapproved document/eligibility policy.

- **VERIFY-001:** Pending/rejected/suspended rider cannot go online for live assignments.
- **VERIFY-002:** Approved rider may become eligible only if subscription, availability, and presence checks also pass.
- **VERIFY-003:** Upload rejects unsafe file type, oversized payload, malformed content and unauthorized access.
- **VERIFY-004:** Verification review records reviewer, timestamp, reason and change history.
- **VERIFY-005:** A rider cannot approve their own documents or change approval status via API.
- **SAFE-001:** Passenger and rider can report an incident tied to a trip.
- **SAFE-002:** Safety reports are visible only to authorized support/admin roles.
- **SAFE-003:** Critical report escalation and contact procedure is rehearsed before live pilot.
- **SAFE-004:** Trip sharing reveals only approved trip details, for a bounded duration.
- **ADMIN-001:** Admin role cannot access super-admin-only settings.
- **ADMIN-002:** Admin MFA is enforced before production pilot.
- **ADMIN-003:** Suspension and reinstatement changes are auditable.
- **AUDIT-001:** Pricing, verification, subscriptions, account suspension and incident access leave useful audit events.
- **AUDIT-002:** Audit logs do not expose raw passwords, session tokens, or full identity documents.

## 12. Security and privacy testing

Use `SECURITY.md` as the canonical security control specification. This section defines test execution, not a substitute for a security review.

| ID | Threat/test | Pass condition |
|---|---|---|
| SEC-001 | Passenger guesses another passenger's trip ID | No unauthorized trip disclosure |
| SEC-002 | Rider accesses trip not assigned/offered to them | Denied |
| SEC-003 | User changes role ID/body parameter | Server ignores/rejects privilege escalation |
| SEC-004 | CSRF on cookie-authenticated write | Rejected |
| SEC-005 | SQL injection/XSS/unsafe file content | Safely handled; no execution/data leak |
| SEC-006 | Login/OTP brute force | Effective rate limits and monitoring |
| SEC-007 | WebSocket cross-origin/auth bypass | Unauthorized connections rejected |
| SEC-008 | Location access after trip end | No unnecessary continuing disclosure |
| SEC-009 | Public link to rider ID document | Not accessible without authorization |
| SEC-010 | Secrets in code, logs, responses, build artifacts | None found |
| SEC-011 | Dependency vulnerabilities | No unreviewed critical/high exposure in release scope |
| SEC-012 | Backup access and restore | Restricted and encrypted as designed |
| SEC-013 | Retention/deletion request | Behavior matches approved privacy policy and legal holds |
| SEC-014 | Security headers/TLS/cookie flags | Production configuration verified |

**Manual checks:** authorization matrix walkthrough; threat-model review; privacy notice and consent/legitimate-basis review with qualified advice; third-party provider data-flow inventory; penetration test or independent review before scaling beyond a controlled pilot.

## 13. Frontend, usability, and accessibility

### 13.1 Passenger E2E journey

**E2E-P001:** Register/login → select pickup manually or via permissioned geolocation → destination → quote → confirm → searching → assignment → status changes → completion → history/receipt → rating.  
**E2E-P002:** Deny geolocation; manual pickup still works.  
**E2E-P003:** No riders available; passenger receives accurate, recoverable message.  
**E2E-P004:** Quote expires while user is deciding; requote required.  
**E2E-P005:** Cancel before assignment; no lingering offers or false charge.  
**E2E-P006:** Network drops during booking; UI checks authoritative state before retrying.

### 13.2 Rider E2E journey

**E2E-R001:** Register → upload verification → pending → admin approves → subscription/trial eligible → online → offer → accept → arrive → start → complete → cash report → earnings.  
**E2E-R002:** Expired subscription blocks new offers but not completion of ongoing trip.  
**E2E-R003:** Browser backgrounding stops reliable updates; rider becomes stale and cannot be matched until active again.  
**E2E-R004:** Reject/ignore offer; offer expires and is reallocated without duplicate acceptance.

### 13.3 Admin E2E journey

**E2E-A001:** MFA login → review rider → approve/reject → audit trail.  
**E2E-A002:** View trip issue → open safety report → record action → restrict access.  
**E2E-A003:** Update configurable pricing version; existing accepted fare unaffected.

### 13.4 Accessibility and device coverage

- **A11Y-001:** Keyboard navigation, focus order, focus visibility, and dialog traps work.
- **A11Y-002:** Forms have labels, instructions, validation messages and accessible errors.
- **A11Y-003:** Contrast and touch targets meet agreed WCAG 2.2 AA target where applicable.
- **A11Y-004:** Screen reader announces booking/offer status without excessive noise.
- **UI-001:** 360px/390px/768px/desktop layouts do not clip core controls.
- **UI-002:** Android Chrome, desktop Chromium, Firefox and targeted Safari/WebKit tested.
- **UI-003:** Slow 3G/high latency and intermittent connections display honest state.
- **UI-004:** Loading, empty, expired, denied permission, offline, and server error states are understandable.

## 14. Performance and capacity testing

**Preliminary targets from PRD (not verified SLAs):** standard API P95 < 500 ms under defined pilot load; quote API P95 < 1 s excluding unusual provider delays; booking feedback within ~3 s in normal conditions; test at least 100 active pilot sessions. Do not claim these pass without load-test evidence.

### 14.1 Workloads

| ID | Workload | Measurement |
|---|---|---|
| PERF-001 | 100 active sessions, mixed passenger/rider/admin traffic | P50/P95/P99 latency, error rate, CPU/memory |
| PERF-002 | Burst of concurrent trip requests in one area | Match latency, conflicts, assignments per trip |
| PERF-003 | Rider GPS updates at configured frequency | Ingest rate, DB write latency, stale detection |
| PERF-004 | Many WebSocket connections and reconnects | Memory/connection, event lag, drop rate |
| PERF-005 | Fare quote requests with routing provider delays | Timeout/fallback behavior, queue growth |
| PERF-006 | PostGIS nearby query at seeded rider counts | Explain plan, index usage, P95 query time |
| PERF-007 | Soak test over sustained period | Resource leaks, pool exhaustion, failure rate |

Define a reproducible workload profile, test data size, infrastructure size, and network characteristics before comparing runs. Keep load generators separate from the application host. No real SMS or payment traffic during load tests.

## 15. Resilience, disaster recovery, and fault injection

- **RES-001:** Restart Go API during an active trip; DB state survives and client recovers.
- **RES-002:** Kill matching worker between commit and event publish; outbox/retry completes delivery.
- **RES-003:** PostgreSQL temporarily unavailable; no false booking success or partial charge.
- **RES-004:** Routing API returns 429/500/timeout; bounded retry/circuit-breaker behavior.
- **RES-005:** Browser disconnects for several minutes; presence goes stale, state resynchronizes.
- **RES-006:** Duplicate queue/event delivery; side effects idempotent.
- **RES-007:** Restore backup to isolated environment; verify integrity and recovery time.
- **RES-008:** Simulate disk pressure, log volume, and DB connection exhaustion; alarms fire.
- **RES-009:** Revoke a compromised session; HTTP and WebSocket access cease.

Recovery time objective (RTO) and recovery point objective (RPO) must be set before live operations; do not infer them from backups alone.

## 16. Defect severity and triage

| Severity | Definition | Example | Release impact |
|---|---|---|---|
| **S0 Critical** | Safety/security/financial integrity catastrophe | Double assignment with unsafe dispatch; exposed identity docs; unauthorized fare change | Block immediately |
| **S1 High** | Core flow broken or significant privacy/reliability issue | Cannot book/complete; widespread lost location state | Block pilot |
| **S2 Medium** | Important feature degraded with viable workaround | History delayed; noncritical admin filter broken | Explicit risk acceptance only |
| **S3 Low** | Cosmetic/minor inconvenience | Spacing or minor copy issue | May defer |

Every defect needs reproduction steps, environment, expected/actual result, severity, owner, and regression test where feasible. Reopened defects are re-triaged; no silent waivers for security or safety issues.

## 17. CI/CD quality gates

### Pull request gate

1. Format/lint Go and JavaScript; static analysis and dependency/secret scan.
2. Run unit tests with coverage report (coverage is diagnostic, not proof of correctness).
3. Run migration/integration tests on disposable PostgreSQL + PostGIS.
4. Run API contract tests and targeted frontend component tests.
5. Run race-sensitive Go tests and concurrency invariants on affected modules.
6. Require review for schema, auth, payments, matching, and security changes.

### Staging release gate

1. Deploy immutable build and migrations to staging.
2. Run smoke tests and critical E2E flows.
3. Run authz/CSRF/WebSocket security regression.
4. Run agreed performance scenario and compare against baseline.
5. Verify dashboards, alert routing, backups, and rollback plan.

### Pilot go/no-go gate

- All S0/S1 defects closed and independently retested.
- All critical booking, assignment, session, location, and payment invariants pass.
- Safety reporting and incident escalation rehearsed with named responsible people.
- Rider verification policy and required legal/insurance/privacy readiness signed off by responsible owners.
- Operational support hours and incident contacts confirmed.
- Pilot geography, pricing, and subscription rules finalized or explicitly disabled/configured for test mode.
- Recovery and monitoring demonstrated.
- Evidence and product-owner approval recorded.

**A green CI build is necessary but not sufficient for real-world launch.**

## 18. Test execution phases and milestones

| Phase | Focus | Exit artifact |
|---|---|---|
| 1 — Foundation | Migrations, identity, sessions, role controls | Auth/DB test report |
| 2 — Geospatial + pricing | PostGIS, presence, quote engine | GEO/FARE report |
| 3 — Matching + trips | State machine, concurrency, idempotency | CONC/TRIP report |
| 4 — User journeys | React E2E, WebSockets, cash and subscription | E2E/RT report |
| 5 — Admin + safety | Verification workflows, audit, incidents | SAFE/ADMIN/SEC report |
| 6 — Hardening | Performance, recovery, accessibility, field test | Pilot readiness report |

Tests should be written alongside implementation, not postponed until the end.

## 19. Test case template

```yaml
id: CONC-001
requirement: "One confirmed rider per trip"
level: integration/concurrency
priority: critical
preconditions:
  - "One searching trip with two eligible rider offers"
steps:
  - "Start two authenticated accept requests simultaneously"
  - "Wait for both responses and query authoritative database state"
expected:
  - "Exactly one accepted assignment"
  - "Exactly one rider marked busy for this trip"
  - "Losing request returns documented conflict/expired status"
  - "One trip-assigned event recorded, with safe retry semantics"
evidence:
  - "CI job, commit SHA, sanitized SQL assertion, response trace"
```

## 20. Reporting and metrics

Maintain a test dashboard or simple Markdown report per build with: test counts by suite, passed/failed/skipped, flaky tests, requirement coverage, open defects by severity, performance baselines, security findings, and pilot readiness decisions. Record reasons for skips; critical tests must never be skipped silently.

### Test report skeleton

```text
Build SHA:
Environment / timestamp:
Migration version:
Suites run:
Passed / failed / skipped:
Critical invariants: PASS / FAIL / NOT RUN
P95 API latency and load profile:
Open S0 / S1 / S2 / S3:
Safety and privacy review:
Known limitations:
Decision: GO / NO-GO
Approver:
```

## 21. Pending policy decisions and test impact

| Pending decision | Test impact | Current strategy |
|---|---|---|
| Subscription pricing | Plan amounts, billing periods, trial terms | Parameterized plans and entitlement boundary tests; no hardcoded prices |
| Pilot location | Service polygon, coverage, field routes | Synthetic geospatial fixtures; location-specific acceptance later |
| Fare policy | Rates, rounding, cancellation adjustments | Formula/immutability and configurable policy tests; exact expected fares later |
| Rider verification | Document requirements, eligibility, renewal | Generic state/permission tests; policy-specific checks after approval |

Also finalize: matching radius and offer TTL, map/SMS providers, payment rollout, data retention, RTO/RPO, incident escalation contacts, and support coverage.

## 22. Definition of done for TEST_PLAN.md

- [x] Test levels and environments defined.
- [x] Core functional, concurrency, geospatial, API, real-time, payment, and security scenarios specified.
- [x] CI, staging, and pilot gates defined.
- [x] Defect severity and evidence requirements defined.
- [x] Open business decisions preserved as TBD.
- [ ] Review test IDs against finalized endpoint and schema contracts.
- [ ] Assign accountable test owners and select tooling.
- [ ] Approve pilot acceptance thresholds and legal/operational prerequisites.
- [ ] Execute tests and attach actual evidence.

---

**Next artifact:** `TASKS.md` — convert requirements and test cases into ordered implementation tickets with dependencies, estimates, owners, and acceptance criteria.
