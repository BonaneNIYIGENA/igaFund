# igaFund — Build Plan

Educational funding platform for verified underprivileged youth in Sub-Saharan Africa (Rwanda pilot).
Source of truth: `Bonane_NIYIGENA_[Assignment2]_ [06292026].pdf`.
Timeline: 3 weeks, intense. Stack: Flask API + React (TypeScript) PWA.

---

## 1. Vision

Build a verified educational-crowdfunding web platform where a student (or an ambassador on their behalf) submits a profile, an admin verifies it, the approved profile becomes publicly browsable, a donor funds it, and the contribution is recorded as routed to the school — never a personal wallet. Everyone is notified.

Where we want it: a deployed, testable MVP that demonstrates the full trust loop end-to-end on a live URL, gradeable against the SRS functional requirements (FR1–FR7) and business rules (BR1–BR10).

Scope discipline: the PDF describes a startup; we build the credible MVP of it. Real money, SMS, native mobile, and V2 scholarship marketplace are deliberately out of this build.

---

## 2. Coverage vs the SRS diagrams

### Covered
| Layer (Components diagram) | In this build |
|---|---|
| Presentation | One React PWA serving all four role UIs (Student, Ambassador, Donor, Admin) |
| API Gateway | Flask REST API with JWT auth + role-based access control |
| Business Logic | Auth, Student Profile, Verification, Payment Routing (simulated), Notifications (email + in-app), Analytics, Offline draft queue |
| Data Layer | SQLite (dev) / Postgres (prod), local file storage, browser IndexedDB as the offline queue |

Class diagram: `User` + four roles (as a role field), `StudentProfile`, `Document`, `Institution`, `Contribution`, `Notification`, `AuditLog` — all covered.

Sequence diagram (donor contribution + routing): browse to approved profiles, contribute, record simulated routing, persist, notify — covered.

Use case diagram: register, create/submit profile, upload docs, capture offline, sync, browse, contribute, review, verify consent, approve/reject, manage users, notify, generate reports — covered.

### Not covered (and why)
| Item | Reason |
|---|---|
| Real MTN MoMo / Airtel / VISA payments | Production keys need a registered business + KYC/AML; simulated with receipt records instead |
| SMS gateway | Cost + paid provider + sender ID; replaced by email + in-app notifications |
| Native mobile app | Replaced by a responsive PWA (one codebase) |
| Full multi-device offline sync engine | Reduced to a single-device IndexedDB draft queue that submits on reconnect |
| Cloud document storage | Local media in dev; cloud is a deploy-time swap, not a feature |
| V2 scholarship marketplace + donor KYC unlock | Explicitly V2 in the PDF |

---

## 3. Backend plan (Flask)

App factory + one blueprint per business-logic service, so each is independently testable.

```
backend/
  wsgi.py                # gunicorn/flask entrypoint
  .flaskenv              # FLASK_APP, FLASK_CONFIG
  app/
    __init__.py          # create_app() factory
    config.py            # DevConfig (SQLite), ProdConfig (Postgres), TestConfig
    extensions.py        # db, migrate, jwt, bcrypt, cors
    models/              # user, profile, document, institution, contribution, notification, audit
    blueprints/
      auth/              # register, login, refresh, me, password reset
      profiles/          # StudentProfile, Document, guardian consent, ambassador enroll
      institutions/      # Institution + simulated payment reference
      contributions/     # Contribution, receipt upload, simulated routing
      notifications/     # email + in-app dispatch
      audit/             # append-only AuditLog
      admin/             # Flask-Admin + approve/reject with mandatory note
    common/              # RBAC decorators, base schema, validators
  migrations/            # Flask-Migrate (Alembic), files numbered 000_, 001_, ...
  requirements.txt       # one list; dev vs prod differ via env vars, not files
  tests/                 # pytest suites
```

Key choices:
- ORM: Flask-SQLAlchemy. Migrations: Flask-Migrate (Alembic) — same migration files run on SQLite dev and Postgres prod.
- Auth: Flask-JWT-Extended. Hashing: Flask-Bcrypt (cost 12, per NFR).
- Validation/serialization: Marshmallow schemas.
- RBAC: custom `role_required` decorator in `common/`.
- Admin: Flask-Admin gives auto CRUD for the verification dashboard; approve/reject requires a mandatory note (BR7).
- Rules enforced in models/schemas, not the UI (BR1, BR2, BR3 hold regardless of client).
- DB switch: `DATABASE_URL` env; SQLite when unset.
- Dependencies: a single `requirements.txt`. Dev vs prod is chosen by env (`FLASK_CONFIG`, `DATABASE_URL`), not by separate dependency files.
- Migrations are numbered sequentially: `000_users_table`, then `001_...` via `flask db migrate --rev-id 001`.

---

## 4. Frontend plan (React + TypeScript + Vite, PWA)

```
frontend/
  index.html
  vite.config.ts         # PWA plugin, /api dev proxy, vitest config
  tsconfig.json
  .env.development        # VITE_API_URL=/api
  .env.production         # VITE_API_URL=/api
  src/
    main.tsx
    app/                  # router, layout, dashboard
    features/
      auth/               # context, login, register, guard, tests
      student/ ambassador/ donor/ admin/
    components/ui/        # shared primitives
    lib/
      api.ts              # fetch client with JWT
      offline.ts          # IndexedDB draft queue + reconnect sync
    styles/tokens.css     # design tokens (colors, type)
    test/setup.ts
```

Icons: `lucide-react` only. No emoji, no ad-hoc SVGs.

---

## 5. Dev vs Production environment

| Concern | Development | Production |
|---|---|---|
| Backend DB | SQLite file | Postgres (`DATABASE_URL`) |
| Flask config | `DevConfig` | `ProdConfig` |
| Secret / hosts | local `.env` | env vars |
| Email | console output | SMTP (free tier) |
| Static/SPA | Vite dev server | React build served by Flask (static) |
| Frontend API base | `/api` via Vite proxy | `/api` same origin |

Setup once:
```
cd backend && python -m venv .venv && .venv/Scripts/python -m pip install -r requirements.txt
cd frontend && npm install
```

Run — development (two processes):
```
# terminal 1
cd backend && flask db upgrade && flask run --port 8000
# terminal 2
cd frontend && npm run dev
```

Environment split (no separate files, just env):
- Dev: `FLASK_CONFIG=dev` (SQLite, console email) — the default in `.flaskenv`.
- Prod: set `FLASK_CONFIG=prod` and `DATABASE_URL=postgresql://...` (plus `SECRET_KEY`, `JWT_SECRET_KEY`).

Run — production (single deploy):
```
cd frontend && npm run build      # emits static bundle
cd backend && flask db upgrade
gunicorn wsgi:app
```
Migrations reconcile the engines: the same Alembic files run on SQLite locally and Postgres in prod; do one full run on Postgres before the demo to catch engine differences early.

---

## 6. Testing (a requirement, gated per phase)

We do not advance a phase until it works and its tests pass.

- Backend: `pytest` + `pytest-flask`, factories via `factory-boy`, coverage via `coverage.py` → `coverage html`.
- Frontend: `vitest` + React Testing Library, `vitest run --coverage`.
- One end-to-end pass on the core loop (browse to funded) with Playwright, which emits a shareable HTML report.

How we show results (evidence for grading):
1. GitHub Actions runs both suites on every push — green checks are timestamped, external proof.
2. Generated HTML coverage reports committed under `docs/testing/` plus screenshots in the report.
3. A requirements traceability table (FR/BR to test id to pass/fail) so a marker can trace every rule to a test.
4. Coverage summary lines pasted per phase in `docs/testing/log.md`.

---

## 7. Phase-by-phase schedule (3 weeks, gated by tests)

A phase is done only when its Definition of Done is met and tests are green. We stay on a phase until it functions.

### Phase 1 — Week 1: Foundations + Authentication
- Backend: app factory + config split, `User` model + roles, register (4 roles), JWT login + refresh, RBAC decorator, bcrypt hashing, password reset (console email in dev).
- Frontend: app shell, PWA config, auth context, login/register pages, route guards, API client, design tokens.
- Tests: register, duplicate email, weak-password rejection, login success/failure, `me`, RBAC denial (backend); login form render + submit, guarded route (frontend).
- Done when: each role logs in and lands on its dashboard; all auth tests pass.

### Phase 2 — Week 2: Profiles, Ambassador onboarding, Offline
- Profile create/edit, document upload, guardian consent, ambassador-assisted enroll, student dashboard, IndexedDB draft queue + auto-submit on reconnect.
- Tests: profile CRUD, ambassador-only ownership (BR5), upload validation, offline queue + sync.
- Done when: a profile is created online and drafted offline then synced; tests pass.

### Phase 3 — Week 3: Verification, Donor portal, Contributions, Deploy
- Admin approve/reject with mandatory note, public browse of approved-only profiles with PII hidden, simulated contribution + receipt + mark routed, audit logging, donor dashboard, in-app notifications + one transactional email, deploy, traceability matrix.
- Tests: approval gates visibility (BR1), routing never personal (BR2), minor consent required (BR3), audit append-only, contribution flow.
- Done when: full loop submit to verify to browse to fund to receipt works live; tests pass.

Stretch (if time): analytics + PDF export, Playwright E2E, SMTP email in prod.

---

## 8. Design direction

### Color palette (non-blue, earthy — growth, trust, dignity)
| Role | Name | Hex |
|---|---|---|
| Primary | Iga Green | `#1E5945` |
| Primary dark | Pine | `#163F31` |
| Accent | Sunrise Amber | `#E8A13A` |
| Secondary | Clay | `#B85541` |
| Background | Sand | `#F5F0E6` |
| Surface | Cream | `#FBF8F1` |
| Text | Charcoal | `#211E1A` |
| Muted | Sage | `#7C8F82` |
| Success `#2F7D5B` | Warning `#D98A2B` | Danger `#B23A2E` |

Green for growth and verified-trust, amber for opportunity, clay as a warm human accent, sand/cream to feel approachable rather than corporate.

### Typography (committed: editorial trust)
- Headings: `Fraunces` (soft serif, warm, dignified) — Google Fonts.
- Body/UI: `Hanken Grotesk` (legible on low-end Android) — Google Fonts.
- Money and data: a tabular/mono face (`Space Grotesk` or `JetBrains Mono`) so funding figures align in tables.
- Considered alternates for later: `Bricolage Grotesque` + `Public Sans`; or Fontshare `Zodiak`/`Boska` + `Switzer`.

---

## 9. Coding conventions
- Comments: one line, only where intent is not obvious. No block essays.
- No emoji, no generic decorative icons — use `lucide-react`.
- Enforce business rules in the backend model/schema layer, not just the UI.
