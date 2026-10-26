# Rider Boda — Backend Services

This directory contains the backend services and API infrastructure for **Rider Boda**, Nairobi's on-demand motorcycle ride-hailing platform.

---

## 🏛️ Architecture & Planned Core Modules

- **Authentication & User Management**: Kenyan mobile auth (`+254`), OTP verification, and JWT session handling.
- **Ride Dispatch Engine**: Real-time geolocation, stage geofencing, and proximity matching with verified boda riders.
- **M-PESA Integration**: Safaricom Daraja API (STK Push, C2B, and B2C instant driver payouts).
- **Live Trip Telemetry**: WebSocket / MQTT live GPS location broadcasting and safety desk monitoring.
- **Emergency SOS & Helpline**: Automated roadside dispatch integration.
