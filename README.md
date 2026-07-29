# igaFund 🎓🌍
**Educational funding platform for verified underprivileged youth in Sub-Saharan Africa (Rwanda Pilot).**

> ⚠️ **Note for graders/facilitators — please read before testing the live link.**
> The backend (`https://igafund-api.onrender.com`) runs on Render's **free tier**, which puts the service to sleep after a period of no traffic. **The first request can take 30-60 seconds to respond** while it wakes back up — this shows up as a blank or stuck-loading page on the very first click, not a bug. If the app doesn't respond within that first minute, wait a moment and reload once. Every request after that is fast.

Welcome to igaFund! This platform is designed to tackle a massive problem in educational crowdfunding: lack of trust. Instead of routing donor money to personal wallets (where it can be misused), igaFund connects verified students with donors and ensures that 100% of the funds are routed directly to the student's verified Educational Institution. 

This repository contains a full-stack Minimum Viable Product (MVP) implementing the core trust loop, built using Python (Flask) and React (TypeScript/Vite) as a Progressive Web App (PWA).

---

## 🌍 Live Deployment

- **App:** https://igafund.vercel.app
- **API:** https://igafund-api.onrender.com/api/health

The production database is seeded with the same demo accounts listed under "Demo Credentials" further down this page, so you can sign in directly on the live site without running anything locally. **Expect a 30-60 second delay on the very first request** if the backend has been idle — see the note at the top of this file.

---

## 🏗️ Architecture & Tech Stack

### Frontend (Client-side)
- **Framework:** React 18, TypeScript, Vite
- **UI & Styling:** Custom CSS Tokens (Earthy/Professional Palette), `lucide-react` for icons, `framer-motion` for micro-animations.
- **Offline Capabilities:** Uses raw `IndexedDB` to capture Student Profile drafts when offline. They are queued and automatically synced when the user's internet reconnects.

### Backend (Server-side)
- **Framework:** Python 3.10+, Flask 3
- **Database:** PostgreSQL (Production) / SQLite (Local Development) via `Flask-SQLAlchemy`.
- **Authentication:** JWT (JSON Web Tokens) with Role-Based Access Control (RBAC) utilizing `Flask-JWT-Extended` and bcrypt hashing.
- **Reporting:** Generates dynamic System Analytics PDF reports using `reportlab`.
- **Email:** Production-ready `smtplib` implementation for system notifications.

---

## ✨ Core Functionalities & Workflows
igaFund supports 4 distinct user roles with specific system constraints (Business Rules):

1. **The Student:** Creates a funding profile, uploads verification documents, and specifies their funding goal. *(BR3: If under 18, guardian consent is automatically required).*
2. **The Ambassador:** Authorized community leaders who can create and manage profiles on behalf of students in deep rural areas who lack internet access.
3. **The Admin:** Verifies documents and Approves/Rejects profiles. *(BR7: Admins must leave a mandatory review note, which is logged immutably in the System Audit Trail).*
4. **The Donor:** Browses *only* approved profiles. Contributes funds which trigger simulated "Routing Tickets" sending the money straight to the institution. *(BR2: Zero funds go to personal wallets).*

---

## 🚀 Setup & Installation Instructions

Follow these steps to run the platform locally on your machine.

> **No paid accounts, API keys, or `.env` file are required to run this locally.** The backend falls back to a local SQLite database, saves uploaded documents to local disk, and prints emails to the console instead of sending them — all automatically, with zero configuration. The steps below are genuinely everything needed to go from a fresh clone to a running app.

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher

### 1. Start the Backend API
Open a terminal and navigate to the backend directory:
```bash
cd backend
```
Create a virtual environment and activate it:
```bash
python -m venv .venv
# On Windows:
.\.venv\Scripts\activate
# On Mac/Linux:
source .venv/bin/activate
```
Install the dependencies:
```bash
pip install -r requirements.txt
```
Run the database migrations to create the schema:
```bash
flask db upgrade
```
**[Crucial Step] Seed the Demo Data:**
This command will populate the database with dummy schools, tickets, and test accounts for all 4 roles.
```bash
flask seed-demo
```
Start the backend server:
```bash
flask run --port 8000
```
*The API is now running on `http://127.0.0.1:8000`*

### 2. Start the Frontend
Open a **new, separate terminal** and navigate to the frontend directory:
```bash
cd frontend
```
Install the node modules:
```bash
npm install
```
Start the development server:
```bash
npm run dev
```
*The frontend is now running on `http://localhost:5173`.*

---

## 🔐 Demo Credentials (Seeded Data)
If you ran `flask seed-demo` during setup, you can immediately log in with the following accounts to test the different role dashboards:

- **Admin Account:** `igafund.admin@gmail.com` / `Admin123!`
- **Ambassador Account:** `igafund.ambassador@gmail.com` / `Ambassador123!`
- **Approved & funded Student:** `igafund.student@gmail.com` / `Student123!`
- **Donor Account:** `igafund.donor@gmail.com` / `Donor123!`
- **Pending review Student (minor, guardian consent):** `mugisha@igafund.local` / `Student123!`
- **Draft (not yet submitted) Student:** `emmanuel@igafund.local` / `Student123!`
- **Rejected (needs changes) Student:** `divine@igafund.local` / `Student123!`
- **Second donor:** `donor2@igafund.local` / `Donor123!`

---

## 🧪 Automated Testing
This project adheres to strict testing standards to guarantee business logic constraints are met. 

**Backend Testing (Pytest):**
We maintain a robust suite of 56 unit tests covering authentication, session security, profiles, documents, contributions, institutions, audit trails, and user management.
```bash
cd backend
pytest
```

**Frontend Unit Testing (Vitest):**
```bash
cd frontend
npm run test
```

**Frontend End-to-End Testing (Playwright):**
We use a headless browser to test the full UI flow from landing to login.
```bash
cd frontend
npx playwright install
npx playwright test
```
