# Rider — Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** 26 October 2026  
**Status:** Draft for review  
**Product:** Web-first motorbike ride-hailing marketplace  
**Related:** `ARCHITECTURE.md`

> **Decision status:** Subscription pricing, pilot location, fare policy, and rider verification requirements remain **open**. Figures and policies below are examples or proposals, not approved decisions.

## 1. Executive summary

Rider connects passengers with motorbike operators through a responsive web application. Passengers choose a pickup and destination, see an automatically calculated fare, request a trip, and receive updates. Eligible operators receive trip offers, accept them, and manage journeys. Administrators oversee verification, operations, subscriptions, safety, and reporting.

Rider's central commercial hypothesis is that operators will prefer a predictable monthly or annual subscription over per-trip platform commissions. Operators keep the full agreed trip fare before their own costs. This model must be validated against demand, acquisition costs, safety obligations, and operating expenses.

**Vision:** Accessible, trusted motorbike transportation that improves operators' earning opportunities.

**Mission:** Make it easy to request a verified motorbike ride while providing operators with transparent, commission-free platform access.

## 2. Problem and opportunity

**Operator pain points:** irregular demand, idle time, reliance on physical stages and informal referrals, limited access to new customers, and difficulty reviewing trip income.

**Passenger pain points:** difficulty locating a motorbike, uncertain prices, limited operator identity information, lack of trip records, and safety concerns.

**Hypothesis:** A local marketplace with transparent upfront fares, reliable matching, verified operators, and a subscription model can create value for both sides. This is unvalidated until measured in a real pilot.

## 3. Objectives and measures

1. Deliver a working end-to-end web booking journey.
2. Enable eligible operators to receive and complete rides without per-trip platform commission.
3. Provide accurate, transparent, server-generated upfront fare estimates.
4. Enforce secure access, trip state integrity, and operational oversight.
5. Measure whether riders receive sufficient trips to justify subscribing.

**Proposed pilot indicators (not commitments):** 50 registered operators, 30 verified active operators, 200 passengers, 300 completed trips, at least 85% trip completion, at least 80% offer acceptance, passenger satisfaction at least 4/5. Also measure matching time, cancellation rate, repeat passenger use, earnings per active operator, paid conversion, retention, and incident handling.

## 4. Personas and roles

| Role | Goals | Key permissions |
|---|---|---|
| Passenger | Book safe, affordable transport | Manage own profile, estimate/book/cancel own trips, review history, rate/report |
| Rider/operator | Receive trips and retain earnings | Submit documents, set availability, accept/reject offers, manage assigned trips, view earnings/subscription |
| Administrator | Run operations | Review applications, monitor trips, manage subscriptions, handle reports within assigned permissions |
| Super administrator | Control sensitive settings | Manage administrator permissions, pricing configurations, audit and platform settings |

## 5. Scope and release boundaries

### 5.1 MVP — required

- Passenger signup, login, profile, and trip history.
- Operator signup, document submission, admin review, and availability controls.
- Pickup/destination entry, route estimate, server-side fare quote, booking request.
- Nearby eligible operator search, time-limited offer, atomic acceptance/rejection.
- Trip lifecycle: requested, searching, assigned, arriving, arrived, in progress, completed, cancelled, or unavailable.
- Active-browser-session status and location updates with stale-location handling.
- Cash payment status recording, basic receipts, rider earnings summaries.
- Basic ratings, complaints, incident reporting, and administrator review.
- Subscription plan and entitlement records with manual/sandbox activation for MVP.
- Admin dashboard, role-based access, audit logs, monitoring, tests.

### 5.2 Later releases

M-Pesa live integration and reconciliation; native Android/iOS apps; reliable background GPS and push notifications; advanced analytics; scheduled trips; multi-stop routes; promotions; corporate accounts; advanced fraud detection; in-app messaging; dynamic pricing if justified.

### 5.3 Not in MVP

Food/parcel delivery, car rides, bidding, multi-country operation, wallet financial services, fully automated dispute resolution, complex surge pricing.

## 6. Passenger requirements

**P-01 Authentication:** Register with verified phone ownership before production booking; log in/out, recover access, edit profile, request account deletion subject to lawful retention. Prevent account enumeration and unauthorized record access.

**P-02 Locations:** Set pickup and destination through map/search; request browser location permission; permit manual correction and manual entry; show unsupported routes clearly.

**P-03 Quote:** Display distance, estimated travel time, upfront fare and disclosed fees before confirmation. Server validates routing inputs and calculates the authoritative quote.

**P-04 Booking:** Submit one active request per account; see searching/assigned/unavailable status; cancel according to an approved cancellation policy; receive rider and motorbike identification once assigned.

**P-05 Trip:** See state transitions and available live location updates; clearly mark location data as stale when the rider browser is inactive. Do not imply continuous background tracking on web.

**P-06 Completion:** View agreed fare, payment status, trip receipt/history; submit rating, dispute, or safety report.

**Acceptance:** A passenger can complete registration → quote → request → assignment → trip → receipt without staff manually editing the database; unauthorized passengers cannot view another person's trip.

## 7. Operator requirements

**R-01 Onboarding:** Register, verify contact, provide personal/motorbike details, upload required documents, see review state. Exact documents and criteria remain pending legal/operational review.

**R-02 Eligibility:** Only approved, active, available, currently entitled operators with fresh locations and no conflicting trip may receive offers.

**R-03 Availability:** Go online/offline; stale location heartbeat automatically removes matching eligibility; going offline must not erase active trip records.

**R-04 Offers:** Receive pickup/destination, offered fare, estimated route and pickup distance; accept/reject within configured expiry. An expired offer cannot be accepted.

**R-05 Trip execution:** Mark arrival, start trip with appropriate passenger confirmation, complete trip, report cancellation or incident; record significant event timestamps.

**R-06 Earnings:** Show trip count and recorded fares by day/week/month, separating rider-reported cash from confirmed digital receipts; show subscription entitlement and expiry.

**Acceptance:** A verified operator can go online, accept exactly one offered trip, finish it, and see its recorded earnings; a suspended/unverified operator cannot receive new live trips.

## 8. Administrator requirements

**A-01 Access:** Secure administrator login, MFA for production, least-privilege role-based permissions and audit logging.

**A-02 Verification:** Review submissions, approve/reject/request changes, record reviewer, time and reason, and restrict document access.

**A-03 Operations:** Search users and trips, suspend/reinstate where authorized, investigate cancellations, matching failures, incidents, and disputes.

**A-04 Configuration:** Manage subscription plans, access periods, and versioned fare rules, subject to approved policies. Pricing changes must not silently alter accepted trips.

**A-05 Reporting:** Show registered/verified/active users, requests, completions, cancellations, incidents, subscription payments, renewals and expiries. Separate cash trip fares from platform subscription revenue.

## 9. Subscription model

**Confirmed principle:** Operators pay for access through subscriptions; the platform takes **0% commission on trip fares**.

**Unconfirmed illustrative plans:** 30-day free trial; KSh 500 monthly; KSh 5,000 annually. These are examples only and must not be hardcoded or published as approved rates.

Requirements:
- Entitlements have account, plan, start/end time, status, and payment history.
- Expired/suspended access blocks new trip offers but does not interrupt an in-progress trip or erase history.
- Renewals and admin adjustments are idempotent, authorized, and audited.
- Paid access activates only on verified payment or authorized manual activation.
- Trial reuse is controlled.
- Trial length, grace periods, refund policy, price and renewal rules are **open decisions**.

## 10. Fare policy and calculations

**Confirmed principle:** Rider automatically calculates the fare rather than negotiating per trip.

**Proposed calculation (not approved policy):**

`fare = max(minimum_fare, base_fare + distance_km * rate_per_km + estimated_minutes * rate_per_minute)`

Illustration only: base KSh 50, KSh 25/km, KSh 2/min, minimum KSh 100; 5 km and 12 minutes → KSh 199.

- The backend owns pricing; browser-supplied prices are never authoritative.
- Routing/geocoding provider estimates distance and duration.
- Store quote ID, expiry, pricing version, route inputs, and accepted amount.
- Use integer minor units or precise decimal arithmetic for money.
- Validate invalid/unreachable routes and quote expiry.
- Changes to fare, cancellation fees, waiting time, and route deviations require a separately approved policy.
- MVP should not silently apply surge pricing.

## 11. Rider discovery and matching

**Initial proposal:** Automatic matching, closest eligible operator first, with fairness considerations.

1. Validate passenger, quote, and request.
2. Find eligible operators with recent location within configurable radius.
3. Rank by proximity or estimated pickup time.
4. Offer trip to an operator for a configured timeout.
5. On rejection/expiry, offer to next eligible operator or expand radius.
6. Atomically assign only if trip and operator remain eligible.
7. Notify both parties or return no-operator-available.

Constraints: one accepted operator per trip; one active trip per operator; no acceptance after expiry; safe retries and idempotency; record attempts for analytics. Search radius and offer timeout remain open.

## 12. Trip lifecycle

Normal path:

`REQUESTED → SEARCHING → ASSIGNED → RIDER_ARRIVING → RIDER_ARRIVED → IN_PROGRESS → COMPLETED`

Exceptional paths: cancellation from permitted states; `SEARCHING → NO_RIDER_AVAILABLE`; incidents during active trips are tracked explicitly.

- Backend validates every transition against role and current state.
- Record actor, timestamp, reason, and transition event.
- Prevent duplicate or out-of-order transitions.
- Do not silently reopen completed trips or delete disputed records.
- Subscription expiry mid-trip does not cancel the journey.

## 13. Payments

**MVP:** Passenger pays operator directly in cash; operator records payment status; passenger may dispute. Recorded cash does not count as Rider subscription revenue or independently verified collection.

**Later:** M-Pesa Daraja for subscriptions and potentially trip payments, with verified callbacks, transaction reconciliation, duplicate-callback protection, refunds/reversals, and legal review if Rider collects passenger funds for operators.

States may include pending, rider-reported paid, confirmed, disputed, failed/cancelled where relevant. Initiating STK Push is not proof of successful payment.

## 14. Safety, verification, and trust

- No live bookings for unverified or ineligible operators.
- Show appropriate operator and motorbike identification to passengers.
- Provide trip-sharing details, accessible incident reporting, and clear emergency guidance.
- Do not suggest emergency responders are automatically dispatched unless an actual integration exists.
- Provide rider reporting for threats, harassment, and payment disputes.
- Assign unique incident IDs, restrict sensitive reports, track review/escalation actions.
- Establish a human support and escalation procedure before pilot launch.
- Confirm identity, licensing, insurance, transport, privacy, and document requirements with qualified local advisers **before real operations**.

## 15. UX and page inventory

**Principles:** Mobile-first, functional and authentic, readable, accessible, low-data, minimal decorative effects, clear loading/empty/error states, keyboard-accessible where relevant.

**Passenger:** Landing, signup/login, dashboard, map booking, quote confirmation, searching, active trip, history, receipt, profile, support/safety.

**Operator:** Signup, documents, verification status, dashboard, subscription, availability, incoming offer, active trip, earnings, history, motorbike/profile, support.

**Admin:** Login, overview, passenger/rider management, verification queue, trips, subscriptions, fare configuration, safety/disputes, analytics, administrator roles, audit logs.

## 16. Technology and architecture constraints

- React + JavaScript + Vite frontend, responsive web first.
- Go modular monolith exposing versioned JSON REST APIs (`/api/v1`).
- PostgreSQL with PostGIS for transactional and geographic data.
- Secure server-managed browser sessions; authenticated WebSockets for active-session events, REST recovery after reconnection.
- Routing/map and messaging/payment integrations behind replaceable provider interfaces.
- Separate business logic from frontend to support future mobile clients.
- No early microservices/Kubernetes requirement.
- Web browser location and notifications may be suspended in background; explicitly account for this limitation.

Refer to `ARCHITECTURE.md` for detailed module boundaries, infrastructure, and system flows.

## 17. Logical data entities

Users; PassengerProfiles; RiderProfiles; Motorbikes; VerificationDocuments; VerificationReviews; RiderLocations; SubscriptionPlans; RiderSubscriptions; SubscriptionPayments; PricingRules; FareQuotes; Trips; TripOffers; TripEvents; TripPayments; Ratings; SafetyReports; Administrators; AuditLogs.

Data integrity: foreign keys, unique constraints, geographic indexes, transactional trip assignment, timestamps in UTC, safe document storage, and retained audit history. Exact schema belongs in `DATABASE.md`.

## 18. API surface (proposed)

| Domain | Example endpoints |
|---|---|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/logout`, `/auth/verify-phone`; `GET /auth/me` |
| Passenger | `GET/PATCH /passenger/profile`; `GET /passenger/trips` |
| Operator | `GET/PATCH /rider/profile`; `POST /rider/documents`; `PATCH /rider/availability`; `POST /rider/location`; `GET /rider/earnings` |
| Trips | `POST /trips/estimate`, `POST /trips`; `GET /trips/:id`; `POST /trips/:id/{accept,reject,arrive,start,complete,cancel}` |
| Admin | `/admin/dashboard`, `/admin/riders`, `/admin/trips`, `/admin/subscriptions`, `/admin/pricing`, `/admin/audit-logs` |

Final API contracts must define schemas, authorization, validation, error codes, rate limits, idempotency keys, and concurrency semantics.

## 19. Security and privacy

- HTTPS; secure HttpOnly session cookies; CSRF protection; session rotation/revocation.
- Strong password hashing if passwords are used; phone verification; admin MFA before launch.
- Backend role/ownership checks on every sensitive endpoint.
- Input validation, request size limits, rate limits, safe CORS, parameterized SQL, safe errors.
- Least-privilege access to identity documents and location history; encrypt appropriately.
- Avoid secrets, access tokens, and sensitive personal data in logs.
- Backups and tested restoration; defined data retention/deletion policy; audit of sensitive actions.
- Review applicable Kenyan privacy, transport, licensing, insurance, payment, consumer and tax requirements before production.

## 20. Non-functional requirements

**Proposed test targets, not guarantees:** Standard API P95 under 500 ms at documented pilot load; fare API P95 under 1 second excluding exceptional provider latency; booking acknowledgment within 3 seconds under normal conditions; test at least 100 concurrent active sessions.

Other requirements: resilience to network interruptions, safe retries, no duplicate assignment, monitoring, database backup/restore, mobile browser usability, low-data design, maintainable modular code, documented migrations, and accessibility targeting WCAG 2.2 AA where practical.

## 21. Notifications and real-time behavior

Notify users of offers, acceptance, arrival, start, completion, cancellation, and subscription status. Use authenticated WebSockets when clients are connected, with REST as the authoritative recovery path. Show stale GPS data as stale; do not promise background tracking or push delivery in the web MVP.

## 22. Testing strategy

**Unit:** fare math, subscription entitlement, matching filters, trip transition validation.

**Integration:** authentication, database constraints, matching concurrency, payment status, admin permissions, routing adapters.

**End-to-end:** Passenger registers → quotes → requests → eligible operator accepts → trip progresses → payment recorded → receipt and earnings appear.

**Security:** authorization bypass, injection, CSRF, rate-limit abuse, duplicate requests, privilege escalation, sensitive data exposure.

**Field:** GPS drift, low-end Android, weak networks, location permission denial, browser suspension, pickup correction, rider rejection, disputes and incident escalation.

## 23. Milestones and deliverables

1. **Product definition:** PRD approval, open decision log, user flows, preliminary compliance review.
2. **Foundation:** repository, React app, Go service, PostgreSQL/PostGIS, migrations, environments, CI.
3. **Identity:** passenger/operator accounts, verification workflow, administrator RBAC.
4. **Booking engine:** maps, quotes, matching, assignment, trip state machine.
5. **Operator operations:** offers, availability, earnings, subscription status.
6. **Admin operations:** verification, pricing configuration, subscription administration, safety reports, analytics.
7. **Pilot readiness:** automated tests, security/performance review, field testing, operational and legal readiness, go/no-go decision.

## 24. Pilot and validation

Pilot in **one limited service area to be chosen later**. Recruit operators through local networks or stages; recruit passengers through relevant communities and businesses. Define support hours, operating hours, safety escalation, cancellation rules, and eligibility before launch.

Measure booking conversion, assignment time, completion, cancellations, trip frequency per operator, rider income, passenger repeat use, subscription willingness/conversion, operating costs, and incidents. Scale only after evidence supports it.

## 25. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Not enough passengers | Concentrated pilot, demand interviews and acquisition tests |
| Not enough operators | Work with existing boda boda networks |
| Riders unwilling to subscribe | Trial and economic validation before fixed pricing |
| GPS inaccurate or unavailable | Manual pickup correction, freshness thresholds |
| Double booking | Database transactions, constraints and idempotency |
| Weak network/browser background suspension | Reconnection, REST recovery, stale-status UI |
| Safety incident | Verification, reporting, operational escalation |
| Fraud | Phone verification, controlled onboarding, abuse monitoring |
| Map/SMS cost escalation | Provider evaluation, monitoring and usage budgets |
| Legal or insurance gaps | Qualified compliance review before real-world launch |
| Founder capacity | Tight scope and milestone-driven delivery |

## 26. Open decisions register

| ID | Decision | Status |
|---|---|---|
| OD-001 | Pilot location and coverage area | Deferred |
| OD-002 | Monthly/annual subscription prices | Deferred |
| OD-003 | Trial length, grace periods and renewals | Deferred |
| OD-004 | Fare rates, minimum, adjustment and cancellation policy | Deferred |
| OD-005 | Rider verification documents and criteria | Deferred, legal review required |
| OD-006 | Matching radius and offer timeout | To determine |
| OD-007 | Map/routing and SMS providers | To evaluate |
| OD-008 | Live M-Pesa integration schedule | Post-MVP proposed |
| OD-009 | Support hours and incident escalation | To determine |
| OD-010 | Data retention policy | Legal review required |
| OD-011 | Target pilot date | Not committed |

## 27. MVP release acceptance gate

The controlled pilot cannot launch until:

1. Passenger and operator authentication works securely.
2. Operator eligibility/verification is enforced.
3. Route quote and upfront fare are visible and server-controlled.
4. Request, matching, acceptance, and cancellation work.
5. Double assignment and conflicting active trips are prevented.
6. Valid trip transitions and event history work.
7. Cash payment recording, trip history, and earnings work.
8. Admin verification, trip review, and incident handling work.
9. Subscription eligibility follows the approved pilot policy.
10. Critical security and reliability tests pass.
11. Safety procedures, transport/legal/insurance checks, and operational support are ready.
12. Field tests pass and product owner approves launch.

## 28. Longer-term roadmap

**v1.0:** Web MVP and controlled pilot.  
**v1.1:** Improve matching, operations, payments, analytics, and retention based on measured usage.  
**v2.0:** Android and potentially iOS apps with robust background location and mobile notifications.  
**v3.0:** Expand geography only when unit economics, safety, and repeat demand are demonstrated.

## 29. Final product direction

Rider prioritizes operator economic empowerment, passenger convenience and safety, and sustainable business growth. The first goal is not to reproduce every Uber or Bolt feature: it is to prove that passengers can reliably book eligible motorbike operators and that a subscription-funded marketplace creates enough value for riders.

**End of PRD v1.0 — Draft for review.**
