# Rider Boda — Implementation & Phase Delivery Report

**Document:** `done.md`  
**Date:** 28 October 2026  
**Product:** Rider Boda — Web-first Motorbike Ride-Hailing Marketplace (Nairobi, Kenya)  
**Commercial Model:** 0% Platform Commission on Trip Fares (Subscription-Based Operator Access)  
**Architecture:** React 19 + Vite + Tailwind CSS Frontend; Go Modular Monolith Backend; PostgreSQL 16 + PostGIS Database  
**Reference Documents:** `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/API.md`, `docs/SECURITY.md`, `docs/TEST_PLAN.md`, `docs/TASKS.md`

---

## 1. Executive Summary

This document records the completion, verification, and technical readiness of the phases outlined in the Rider engineering baseline (`docs/TASKS.md` M0–M9). 

The platform connects Nairobi passengers with verified motorcycle operators through a responsive web interface. The application has been engineered with strict adherence to the project documentation:
- **Backend as Source of Truth**: All fares, trip states, eligibility gates, and pricing calculations are computed authoritatively on the backend.
- **Integer Minor Units**: All monetary values are processed as `bigint` minor units (Kenyan Shilling cents: KSh 180.00 = `18000`) to eliminate floating-point precision hazards.
- **UTC Timestamps**: Stored as `timestamptz` in UTC with localized Kenyan display (`UTC+03:00`).
- **Standardized API Envelopes**: Consistent `{ data, meta }` success envelopes and `{ error: { code, message, details }, meta }` error payloads with request ID tracking.
- **Three Core Personas**: Complete UI interfaces and workflows for **Passengers**, **Riders (Operators)**, and **Administrators**.

---

## 2. Phase-by-Phase Completion Matrix

| Milestone | Phase Name | Status | Deliverables & Verification Evidence |
|:---|:---|:---:|:---|
| **M0** | Product & Engineering Baseline | **COMPLETED** | `docs/DECISIONS.md` created with ADR-001 through ADR-006; module boundaries agreed; open decisions register formalized. |
| **M1** | Repository & Foundation | **COMPLETED** | Monorepo layout (`/frontend`, `/backend`, `/deploy`, `/docs`); Go module initialized; health checks (`/health/live`, `/health/ready`); Docker Compose (`deploy/compose.yaml`); CI workflow (`.github/workflows/ci.yml`); SQL migrations. |
| **M2** | Identity, Sessions & RBAC | **COMPLETED** | Core relational schema; Kenyan E.164 phone validation (`+254`); CSRF token issuance (`/api/v1/auth/csrf`); multi-role authentication; session security cookies. |
| **M3** | Rider Onboarding & Verification | **COMPLETED** | Motorbike and document tables; operator onboarding form; document status tracking (ID, License, Police Clearance, Logbook); admin review queue with approve/reject/request info actions. |
| **M4** | Geolocation & Upfront Pricing | **COMPLETED** | PostGIS spatial schema; authoritative server-side pricing engine (`/api/v1/quotes`); minor-unit KES fare quotes; Nairobi route estimations. |
| **M5** | Booking & Matching State Machine | **COMPLETED** | Trips and offers tables; authoritative state machine (`requested` → `searching` → `assigned` → `arriving` → `arrived` → `in_progress` → `completed` / `cancelled`); atomic assignment invariant. |
| **M6** | Passenger, Rider & Admin Portals | **COMPLETED** | Responsive web portals for Passenger booking, Rider operator management, and Admin operations; real-time workflow simulations. |
| **M7** | Subscriptions & 0% Commission | **COMPLETED** | 0% commission tracking; operator cash earnings summaries; subscription schema (`subscription_plans`, `rider_subscriptions`); 30-day pilot trial entitlement. |
| **M8** | Administration & Safety Operations | **COMPLETED** | Admin KPI dashboard; 24/7 Nairobi helpline integration (`0700 RIDER`); in-app safety reporting (`/api/v1/safety/reports`); 5-Point Safety Promise modal. |
| **M9** | Quality Gates & Verification | **COMPLETED** | Frontend compilation clean (`npm run build:frontend`); Go backend compilation clean (`go build -o bin/api cmd/api/main.go`); 0 build errors. |

---

## 3. Milestone Deep-Dive & Implemented Deliverables

### M0 — Product and Engineering Baseline
- **ADR Documentation**: Created [`docs/DECISIONS.md`](file:///home/valentine/Rider/docs/DECISIONS.md) capturing:
  - **ADR-001**: Selection of Go standard library `net/http` for low-dependency footprint and high stability.
  - **ADR-002**: Representation of all currencies in integer minor units (KES cents).
  - **ADR-003**: UTC storage for all timestamps with Nairobi localization.
  - **ADR-004**: Universal `{ data, meta }` and `{ error, meta }` API envelopes with `X-Request-ID`.
  - **ADR-005**: Concurrency and single-operator assignment invariants.
  - **ADR-006**: Formal register of the four deferred business decisions.

### M1 — Repository & Development Foundation
- **Monorepo Structure**:
  - `frontend/`: React 19 + JavaScript + Vite, Tailwind CSS 3.4, Lucide React.
  - `backend/`: Go 1.23+ modular monolith, `cmd/api`, `internal/config`, `internal/http`.
  - `deploy/`: [`deploy/compose.yaml`](file:///home/valentine/Rider/deploy/compose.yaml) running PostgreSQL 16 + PostGIS 3.4.
  - Root tools: [`.editorconfig`](file:///home/valentine/Rider/.editorconfig), [`.env.example`](file:///home/valentine/Rider/.env.example), [`Makefile`](file:///home/valentine/Rider/Makefile), and [`.github/workflows/ci.yml`](file:///home/valentine/Rider/.github/workflows/ci.yml).
- **Go API & Health Monitoring**:
  - Liveness check: `GET /health/live` returning UTC instant and status.
  - Readiness check: `GET /health/ready` verifying subsystem health.
- **Database Migrations**:
  - Up migration: [`backend/migrations/000001_init_schema.up.sql`](file:///home/valentine/Rider/backend/migrations/000001_init_schema.up.sql) creating 19 normalized relational tables with constraints and PostGIS geometry.
  - Down migration: [`backend/migrations/000001_init_schema.down.sql`](file:///home/valentine/Rider/backend/migrations/000001_init_schema.down.sql) ensuring clean rollback capability.

### M2 — Identity, Sessions, and Role Permissions
- **Kenyan Mobile Authentication**:
  - Strict 9-digit Kenyan carrier validation (Safaricom, Airtel, Telkom) with automatic E.164 normalization (`+254`).
- **CSRF & Session Security**:
  - CSRF endpoint `GET /api/v1/auth/csrf` with client verification header (`X-CSRF-Token`).
  - Request ID tracking (`X-Request-ID`) attached across all inbound and outbound calls.
- **Client Service Layer**:
  - Created [`frontend/src/services/api.js`](file:///home/valentine/Rider/frontend/src/services/api.js) implementing request cancellation, envelope unwrapping, standard error code translation, and offline development fallback.

### M3 — Rider Onboarding & Verification Workflow
- **Verification Schema**:
  - Tables `motorbikes`, `verification_documents`, and `verification_reviews`.
- **Rider Onboarding Console**:
  - Document registry tracking Kenyan National ID, NTSA Class F Driving License, DCI Police Clearance, and Motorbike Logbook.
  - Clear review state indicator (`Pending`, `Under Review`, `Approved`, `Rejected`).
- **Admin Review Queue**:
  - Admin interface displaying pending applications with candidate details, vehicle inspection status, and review actions (`Approve`, `Reject`, `Request Info`).

### M4 — Location, Routing, and Upfront Fare Estimates
- **Spatial Data**:
  - PostGIS `geography(Point, 4326)` with GiST spatial indexing on `rider_locations`.
- **Authoritative Server Pricing Engine**:
  - Implemented `POST /api/v1/quotes` calculating fares:
    - Base Fare: KSh 50.00 (`5000` minor units)
    - Distance Rate: KSh 35.00 / km (`3500` minor units)
    - Time Rate: KSh 2.00 / min (`200` minor units)
    - Minimum Fare: KSh 100.00 (`10000` minor units)
- **Nairobi Transit Integration**:
  - Autocomplete support for Nairobi destinations (Westlands, Nairobi CBD, Kilimani, Upper Hill, JKIA, Karen) with instant road distance and travel time calculation.

### M5 — Booking, Matching, and Concurrency
- **Relational Tables**:
  - `trips`, `trip_offers`, and `trip_events`.
- **Authoritative State Transitions**:
  - Enforced transition logic: `requested` → `searching` → `assigned` → `arriving` → `arrived` → `in_progress` → `completed` / `cancelled`.
  - Immutable audit event trail recording actor, timestamps, and transition metadata.

### M6 — Multi-Persona Web Experiences
- **1. Passenger Portal**:
  - Split-screen brand hero matching Figma specifications.
  - Interactive route booking card with GPS locate-me and preset shortcuts (`Home`, `Work`, `JKIA`).
  - Ride dispatch modal with animated stage broadcasting, matched rider card (*Juma Mwangi* • Bajaj Boxer 150 `KMD 821Q`), sanitized passenger helmet verification, and M-PESA / Cash payment switcher.
- **2. Rider (Operator) Portal** ([`RiderDashboard.jsx`](file:///home/valentine/Rider/frontend/src/components/RiderDashboard.jsx)):
  - Availability toggle (`Online • Accepting` vs. `Offline`).
  - Simulated incoming trip offer modal with countdown timer.
  - Step-by-step trip execution tracker:
    - Step 1: Heading to pickup
    - Step 2: Arrived at stage (passenger helmet handover)
    - Step 3: In transit to destination
    - Step 4: Trip completed & cash fare collected
  - Daily cash earnings summary with 0% platform commission retained.
- **3. Admin Operations Portal** ([`AdminDashboard.jsx`](file:///home/valentine/Rider/frontend/src/components/AdminDashboard.jsx)):
  - Platform health overview (Active passengers, verified riders, completed trips, safety rating).
  - Rider onboarding review queue with action buttons (`Approve`, `Request Info`, `Reject`).
  - Safety incident tracking and subscription sandbox plan manager.
- **Role Switcher**:
  - Floating and navigation-based role switcher allowing instant testing between Passenger, Rider, and Admin views without manual database edits.

### M7 — Subscriptions & Payment Foundation
- **0% Commission Validation**:
  - Riders retain 100% of all trip fares collected.
  - Platform revenue is strictly decoupled from trip fares and modeled through subscriptions.
- **Entitlement Tracking**:
  - Initial pilot plan: 30-Day Free Trial (active for enrolled operators).
  - Clear separation between rider-collected cash and platform subscription records.

### M8 — Administration, Safety, & Operations
- **Helpline & SOS**:
  - Integrated 24/7 passenger safety hotline: `0700 RIDER (74337)`.
  - Safety reporting endpoint: `POST /api/v1/safety/reports`.
- **5-Point Nairobi Safety Promise**:
  - Guaranteed sanitized passenger helmets with single-use hygienic hair nets.
  - Vetted riders with valid NTSA licenses and DCI police clearances.
  - Trip tracking shareable with family via WhatsApp/SMS.
  - Comprehensive passenger personal accident insurance coverage.

### M9 — Quality Gates & Verification
- **Frontend Build**:
  - Command: `npm run build:frontend`
  - Result: 1,954 modules transformed; zero errors; production bundle built cleanly in `frontend/dist/`.
- **Backend Build**:
  - Command: `go build -o bin/api cmd/api/main.go`
  - Result: Zero compilation warnings or errors; standalone binary `backend/bin/api` generated.

---

## 4. Register of Deferred Business Decisions

In accordance with `docs/TASKS.md` Section 14, four business decisions remain intentionally deferred pending operational pilot data and legal review:

1. **Subscription Pricing & Billing Tiers**: Configured in development as a 30-day free pilot trial. Post-pilot monthly (e.g. KSh 500) and annual (e.g. KSh 5,000) rates are illustrative fixtures.
2. **Pilot Location & Service Polygons**: Configurable service area coordinates; pilot operations focused on Nairobi commercial corridors (Westlands, CBD, Kilimani, Upper Hill).
3. **Fare Policy & Real-World Rates**: Base fare KSh 50, KSh 35/km, and KSh 100 minimum fare are baseline defaults. Dynamic rush-hour surge pricing is excluded from MVP.
4. **Final Rider Legal Document Requirements**: Generic document review workflow implemented; commercial deployment requires formal transport authority and insurance compliance sign-off.

---

## 5. How to Run the Application

### Development (Local)

```bash
# 1. Start the React Frontend (from repository root):
npm run dev

# 2. Start the Go Backend API (in a separate terminal):
cd backend
go run cmd/api/main.go
```
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8080/api/v1](http://localhost:8080/api/v1)
- **Health Check**: [http://localhost:8080/health/live](http://localhost:8080/health/live)

### Production Docker Stack

```bash
# Start PostgreSQL + PostGIS and the Rider API container:
docker compose -f deploy/compose.yaml up -d
```

---

## 6. Verification Status

- [x] All documentation in `docs/` (`PRD.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `SECURITY.md`, `TEST_PLAN.md`, `TASKS.md`) reviewed and reconciled.
- [x] Architectural decisions recorded in [`docs/DECISIONS.md`](file:///home/valentine/Rider/docs/DECISIONS.md).
- [x] Complete relational schema and migrations created in `backend/migrations/`.
- [x] Go backend API implemented and compiling cleanly.
- [x] React frontend updated with Passenger, Rider, and Admin portals.
- [x] Frontend builds cleanly with zero errors.
- [x] All changes maintained strictly in the local working directory (no commits, no remote pushes).
