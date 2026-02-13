# Repository Deep Analysis: Subramanya Temple App & Registry (S.T.A.R.)

## 1) Executive Understanding

This repository is a **desktop-first temple operations platform** that combines:
- a **FastAPI backend** (`star-backend`) for booking, accounting, shaswata/subscription workflows, authentication, and receipt printing,
- a **React + Vite frontend** (`star-frontend`) optimized for clerk/admin workflows,
- an **Electron shell** (`electron`) that packages frontend + backend into a Windows desktop app,
- a SQL schema draft (`database/schema.sql`) that appears to be a broader PostgreSQL-oriented design reference than the currently deployed SQLite runtime.

The system is strongly oriented around **offline/local deployment** (SQLite next to executable, Electron shell, printer integration), and is designed for day-to-day temple office operations rather than cloud-native multi-tenant scale.

---

## 2) Top-Level Architecture

## Runtime architecture
1. Electron starts a bundled backend executable (`temple-backend.exe`).
2. Backend serves API endpoints and optionally static frontend assets.
3. Electron loads the built frontend (`dist/index.html`) into a BrowserWindow.
4. Frontend calls backend APIs on `http://127.0.0.1:8000`.

## Packaging model
- Backend can run as Python source in dev and as frozen executable via PyInstaller in production.
- Frontend is a Vite SPA build.
- Electron bundles the built frontend and ships backend executable as an extra resource.

This forms a local, self-contained Windows deployment with minimal external infrastructure dependencies.

---

## 3) Backend Deep Dive (`star-backend`)

## 3.1 Stack and bootstrapping
- FastAPI app with permissive CORS.
- Startup hook initializes DB/tables and seeds defaults.
- Auth uses JWT + passlib password hashing.
- Static assets mount logic supports both dev and frozen executable modes.

Key design note: backend contains both API and static SPA serving logic, so Electron can point to bundled files while API remains local.

## 3.2 Data layer
- SQLAlchemy ORM + SQLite (`star_temple.db`) with dynamic path resolution:
  - frozen mode: DB beside executable,
  - dev mode: DB inside backend app directory.
- Foreign keys explicitly enabled with SQLite PRAGMA hook.
- Seed process creates:
  - default admin (`admin/admin123`),
  - starter seva catalog.

## 3.3 Domain model understanding
Core entities:
- `SevaCatalog`: master list of sevas (English/Kannada names, price, flags like slot-based and shaswata eligibility).
- `Devotee`: profile table with bilingual names, gothra, nakshatra/rashi, location fields.
- `ShaswataSubscription`: recurring/perpetual seva setup supporting **LUNAR**, **GREGORIAN**, and **RATHOTSAVA** styles.
- `Transaction`: booking/payment ledger with receipt number, payment metadata, seva date, and snapshot devotee name.
- `User`: admin/clerk login and role-based access.

This structure clearly models three business strata:
1. **Master data** (sevas/users),
2. **Identity/profile** (devotees),
3. **Financial + ritual operations** (transactions/subscriptions).

## 3.4 API surface map
Major endpoint groups:
- Auth & user management: `/token`, `/users/*`, `/create-admin`.
- Catalog + booking: `/sevas`, `/book-seva`, `/transactions`, `/devotees/{phone}`.
- Shaswata lifecycle: `/shaswata/*`, `/subscriptions/*` (dispatch/feedback tracking).
- Daily ritual support: `/daily-sankalpa`.
- Reporting: `/reports`, `/reports/collection`, `/reports/export`.
- Panchangam: `/panchangam/find`.
- Device integration: `/print/preview`, `/print/receipt`, `/print/image`.
- AI assistant router: `/genesis/invoke`.

Overall pattern: a fairly monolithic `main.py` with direct endpoint definitions and helper logic, while deeper business logic lives in `crud.py` and utility modules.

## 3.5 Business logic notes (CRUD + services)
- `crud.py` owns transaction creation, devotee upsert, shaswata workflows, reporting aggregation.
- Receipt numbering is generated in backend logic.
- Shaswata matching and “pending feedback” mechanics are present for automation workflows.
- Reporting offers both aggregate metrics and export support.

## 3.6 Panchang engine
- `panchang.py` computes panchang attributes (sunrise/sunset context, tithi/nakshatra/rashi related outputs) and kaala windows.
- Used in APIs such as panchang search and daily sankalpa generation logic.

## 3.7 Printing subsystem
- `printer_service.py` renders a bilingual thermal-style receipt image (Pillow-based) and sends it to Windows printer APIs.
- API supports:
  - preview generation,
  - direct print with dual-copy flow (devotee + priest),
  - uploaded image printing for front-end rendered receipts.

## 3.8 AI/assistant subsystem (`daiva_setu.py`)
- A lightweight intent engine classifies text into categories (pricing/timing/education/panchang/general).
- Includes rudimentary RAG-like lookup against seva catalog via SQL text query.
- Returns suggested UI actions with a confidence score.

This is currently a **rule-based assistant facade**, not an LLM integration, but it is architected as an extensible API router.

## 3.9 Security posture (observed)
Strengths:
- JWT-protected user routes.
- Role checks for admin-only operations.
- Basic payload scanning for XSS/SQL-like patterns on selected flows.

Risks/gaps:
- Hardcoded `SECRET_KEY` in source.
- Default credentials seeded in code (`admin123`) and additional create-admin with known password.
- CORS is fully open (`*`).
- AI SQL lookup builds SQL fragments from tokens (parameterized values are used, but pattern construction remains fragile).
- Monolithic endpoint file increases chance of cross-cutting policy drift.

---

## 4) Frontend Deep Dive (`star-frontend`)

## 4.1 Stack
- React 19 + Vite + Tailwind.
- Axios API client with auth token interceptor.
- Heavy component-based UI under `src/components`.

## 4.2 App shell and navigation
- `App.jsx` drives authentication state, role checks, page routing via local state (`activePage`), and global modal/chat components.
- Not using a strongly route-centric structure in practice, despite `react-router-dom` being present.
- Role model aligns with backend (`admin`, `clerk`) and guards pages accordingly.

## 4.3 Feature modules
- `Dashboard`: seva discovery cards, filtering, booking launch.
- `BookingModal`: devotee capture, payment mode handling, receipt rendering/reprint hooks.
- `ShaswataForm` + `ShaswataCertificate`: wizard-like recurring seva registration and printable certificate UX.
- `DailyTransactions`: date-based transaction listing and reprint workflow.
- `ReportsDashboard`: charting + PDF generation.
- `Panchangam`: panchang data presentation.
- `Settings`: user management/preferences-style interface.
- `GenesisChat`: chat UI wrapper calling backend assistant endpoint.

## 4.4 Service layer
- `services/api.js` centralizes axios config and helper methods.
- `config.js` pins API URL to localhost backend.

This is appropriate for Electron/local deployment, but would need environment-aware API base URLs for multi-environment CI/CD.

---

## 5) Electron Desktop Layer (`electron`)

- Starts backend executable as child process.
- Waits ~3 seconds before creating BrowserWindow.
- Loads frontend from local `dist` file.
- Kills backend process on app shutdown (with Windows taskkill fallback).

This design gives a simple operational envelope for non-technical temple staff (double-click app, everything local).

---

## 6) Data/Control Flow (end-to-end)

## Booking flow
1. Clerk logs in and selects seva in frontend.
2. Frontend posts booking payload to `/book-seva`.
3. Backend validates payload, upserts/finds devotee, records transaction, generates receipt metadata.
4. Frontend shows success and may trigger print endpoint.

## Shaswata flow
1. Clerk/admin submits subscription form.
2. Backend stores devotee + subscription metadata (lunar/gregorian/rathotsava).
3. Operational dashboards fetch pending items for dispatch/feedback.
4. Dispatch/feedback endpoints update lifecycle timestamps.

## Reporting flow
1. Frontend requests date-range report endpoints.
2. Backend aggregates financial totals + distribution and returns chart/table-ready JSON.
3. Frontend renders chart and optional PDF export.

---

## 7) Repository Quality Assessment

## Strengths
- Coherent domain modeling for temple workflows.
- Practical offline-first deployment model.
- End-to-end flow from booking to printing is implemented.
- Bilingual and culturally contextualized UX elements are deeply integrated.
- Includes scripts/tests/stress artifacts, indicating operational awareness.

## Constraints / technical debt
- Large monolithic backend entrypoint (`main.py`) with mixed concerns.
- Security hardening needed before wider deployment.
- Test suite appears partly script-style and inconsistent with modern pytest patterns.
- Mixed maturity in architecture docs (some strategic docs are aspirational rather than implemented).
- Electron package currently includes full `node_modules` footprint in repo (size/maintainability concern).

---

## 8) Recommended Refactor Roadmap (pragmatic)

1. **Security-first sprint**
   - Move secrets and default creds to environment/bootstrap flow.
   - Disable public create-admin in production.
   - Tighten CORS for packaged/local-only context.

2. **Backend modularization**
   - Split `main.py` into routers (`auth`, `transactions`, `shaswata`, `reports`, `printing`, `panchang`, `genesis`).
   - Add service layer interfaces around `crud.py` domains.

3. **Config hardening**
   - Centralize config in settings module (pydantic-settings).
   - Per-environment frontend API base URL handling.

4. **Testing uplift**
   - Convert ad-hoc scripts into proper pytest integration tests with temp SQLite DB.
   - Add API contract tests for key paths (`/book-seva`, `/reports`, `/shaswata/subscribe`).

5. **Data governance**
   - Clarify source of truth between SQLite runtime schema and `database/schema.sql`.
   - Add explicit migration/versioning approach (Alembic or controlled SQL migration scripts).

---

## 9) Final Understanding Statement

This repository is a **functional temple operations product**, not just a prototype. It already solves a real-world workflow chain (authentication → booking → receipt/printing → recurring seva management → reporting) with a deployment strategy that matches low-infrastructure environments. The highest leverage next step is **security + maintainability hardening** rather than net-new features.
