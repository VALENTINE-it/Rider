# Rider Boda — Frontend (React)

A responsive, high-performance React frontend for **Rider Boda**, Nairobi's on-demand motorcycle ride-hailing platform.

Built directly from design specifications and reference screens featuring a split-screen brand hero, Kenyan mobile authentication (+254 standard), interactive password management, accessible modals, and seamless tab transitions.

---

## 🎨 Visual Identity & Design Principles

- **Primary Brand Accent**: Terracotta / Burnt Orange (`#E7532E`, hover `#D44723`) for primary CTA buttons, active tab indicators, and brand logo.
- **Warm Editorial Cream Background**: `#F8F5EE` for comfortable contrast and reduced eye fatigue.
- **Deep Forest Overlay**: `#102620` to `#183129` paired with urban Nairobi boda photography by Dwayne Joe (Unsplash).
- **Amber Gold Highlights**: `#F1B643` for "NAIROBI MOVES WITH US" and headline emphasis.
- **Typography**: Clean grotesque sans-serif (*Plus Jakarta Sans*) with distinct type scale, sentence-case microcopy, and generous letter spacing on kickers.

---

## 🚀 Key Features

1. **Authentication Tabs**: Seamless switching between **Log in** (`KARIBU TENA`) and **Register** (`JOIN RIDER`) with active indicator and URL sync (`?tab=login` or `?tab=register`).
2. **Kenyan Phone Field (`+254`)**:
   - Formats input automatically (e.g. `712 345 678`).
   - Automatically handles leading `0` or `254` inputs.
   - Enforces 9-digit Kenyan carrier validation (Safaricom, Airtel, Telkom).
3. **Password Management**:
   - Show/hide password visibility toggle with Lucide icons.
   - Built-in validation feedback for minimum 6 characters.
   - Interactive **Forgot Password modal** with simulated SMS OTP verification flow.
4. **Registration Workflow**:
   - Full Name input with icon.
   - Optional Email field with RFC-compliant regex validation.
   - Interactive **Terms of Service & Privacy Policy** modal with Nairobi Boda regulations, safety compliance, and passenger protections.
5. **Post-Login Booking Dashboard ("Your city. Your way.")**:
   - **Header & Navigation**: Sticky brand bar with terracotta "S" logo, interactive notifications popup, and verified passenger profile pill (`KM` / `Kevin` / `4.9 rating`).
   - **Interactive Route Booking Card**: Connected pickup and destination fields with vertical dotted route track, GPS locate-me button, Nairobi popular destination autocomplete (Westlands, CBD, Kilimani, Upper Hill, JKIA, Karen), and preset quick pills (`Home`, `Work`, `JKIA`).
   - **Real-Time Fare & Time Calculation**: Instant fare estimation (`KSh 180 - 240`) and travel duration calculator.
   - **Interactive Ride Dispatch Simulation**: Realistic Nairobi dispatch modal simulating rider radar search, matched rider card (*Juma Mwangi* • Bajaj Boxer 150 `KMD 821Q`), M-PESA / Cash payment selection, and communication shortcuts.
   - **Why Rider Benefits Grid**: 3 interactive feature cards (`Minutes away`, `Ride with confidence`, `Clear, fair fares`) with deep-dive modals.
   - **Safety First Helmet Banner**: Full-width split banner featuring authentic motorcycle rider photography (`KMCJ 289K`) and Rider Boda's 5-Point Safety Promise modal.
6. **Responsive Layout**:
   - **Desktop (≥ 1024px)**: 50/50 split-screen with full photography hero, transit route mesh overlay, and verified credibility metrics (`4.9 Rating`, `5 min Pickup`, `24/7 Availability`).
   - **Mobile / Tablet (< 1024px)**: Compact top brand banner ensuring inputs and primary CTAs remain immediately visible without pushing forms below the fold.

---

## 📁 Repository Structure

```text
Rider/
├── frontend/               # React 19 + Vite + Tailwind CSS frontend
│   ├── src/
│   │   ├── assets/         # Photography and graphic assets
│   │   ├── components/     # UI components (Auth, Dashboard, Modals)
│   │   ├── App.jsx         # Root app orchestrator
│   │   └── main.jsx        # Entry point
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── backend/                # Backend API & dispatch services
│   └── README.md
├── package.json            # Monorepo management scripts
└── README.md
```

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 8, Tailwind CSS 3.4, Lucide React, Google Fonts (*Plus Jakarta Sans*)
- **Backend**: API & microservices infrastructure

---

## 💻 Getting Started

### Development Server
```bash
# From repository root:
npm run dev

# Or directly in frontend:
cd frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build & Preview
```bash
# From repository root:
npm run build:frontend

# Or directly in frontend:
cd frontend
npm run build
npm run preview
```
