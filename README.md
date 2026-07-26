# igaFund 🎓🌍
**Educational funding platform for verified underprivileged youth in Sub-Saharan Africa (Rwanda Pilot).**

Welcome to igaFund! This platform is designed to tackle a massive problem in educational crowdfunding: lack of trust. Instead of routing donor money to personal wallets (where it can be misused), igaFund connects verified students with donors and ensures that 100% of the funds are routed directly to the student's verified Educational Institution. 

This repository contains a full-stack Minimum Viable Product (MVP) implementing the core trust loop, built using Python (Flask) and React (TypeScript/Vite) as a Progressive Web App (PWA).

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

- **Admin Account:** `admin@igafund.local` / `Admin123!`
- **Ambassador Account:** `ambassador@igafund.local` / `Ambassador123!`
- **Approved Student:** `keza@igafund.local` / `Student123!`
- **Pending Student:** `mugisha@igafund.local` / `Student123!`
- **Donor Account:** `donor@igafund.local` / `Donor123!`

---

## 🧪 Automated Testing
This project adheres to strict testing standards to guarantee business logic constraints are met. 

**Backend Testing (Pytest):**
We maintain a robust suite of 29 unit tests covering authentication, profiles, audit trails, and contributions.
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
