# Rider — Architecture Decision Records (ADRs)

**Version:** 1.0  
**Date:** 28 October 2026  
**Status:** Approved  
**Related Documents:** `PRD.md`, `ARCHITECTURE.md`, `API.md`, `DATABASE.md`, `TASKS.md`

---

## ADR-001: Backend Router and Framework
- **Status:** Approved
- **Decision:** Use standard library `net/http` with idiomatic middleware chaining.
- **Rationale:** Low dependency surface, stable across Go releases, zero external framework vulnerability risk, and easily swappable if performance needs demand.

## ADR-002: Monetary Values and Currency Handling
- **Status:** Approved
- **Decision:** All monetary transactions and fare calculations are represented as **integer minor units** (e.g. Kenyan Shilling cents: KSh 180.00 = `18000` minor units) in `bigint`.
- **Rationale:** Prevents floating-point rounding errors across database, Go services, and frontend clients.

## ADR-003: Timestamps and Localization
- **Status:** Approved
- **Decision:** All database timestamps are stored in UTC (`timestamptz`). Display layers in the web app format timestamps to Nairobi local time (`UTC+03:00`).

## ADR-004: API Envelope and Standard Errors
- **Status:** Approved
- **Decision:** Unified envelope with `data` and `meta` (containing `request_id`). Errors return `{ error: { code, message, details: [] }, meta: { request_id } }`.
- **Rationale:** Predictable client contracts, robust troubleshooting, and sanitized error messages preventing internal system leakage.

## ADR-005: Concurrency and Trip Assignment Invariant
- **Status:** Approved
- **Decision:** Exactly-one operator per trip enforced via transactional atomic assignment (`UPDATE trips SET rider_id = ... WHERE id = ... AND status = 'searching'`).
- **Rationale:** Eliminates race conditions and double-booking.

## ADR-006: Open / Deferred Business Decisions Register
The following four business policies remain deliberately deferred pending stakeholder and regulatory approval:
1. **Subscription Pricing & Billing Frequency:** Trial duration is set to 30 days in development; production pricing will be set post-pilot.
2. **Pilot Location & Service Polygons:** Configurable service area coordinates; defaults to Nairobi (Westlands, CBD, Kilimani, Upper Hill).
3. **Fare Rates and Adjustments:** Standard pilot rate uses base fare KSh 50, KSh 35/km, and KSh 100 minimum fare. Production surge pricing is out-of-scope for MVP.
4. **Legal Document Verification Criteria:** Generic document upload workflow with admin review queue implemented; legal compliance validation before commercial passenger operations.
