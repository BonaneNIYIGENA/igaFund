# igaFund — Requirements Traceability Matrix

This document maps all Functional Requirements (FR1–FR7) and Business Rules (BR1–BR10) from the SRS specification (`Bonane_NIYIGENA_[Assignment2]_ [06292026].pdf`) to their corresponding API endpoints, frontend components, and automated test cases.

---

## 1. Functional Requirements (FR1 – FR7)

| Requirement ID | Description | Backend Implementation | Frontend Component | Automated Test Verification |
|---|---|---|---|---|
| **FR1: Auth & User Management** | User registration (Student & Donor self-service; Admin DB-seeded; Ambassador promoted from verified students). | `app/blueprints/auth/routes.py` (`/auth/register`, `/auth/login`), `admin/routes.py` (`/promote-ambassador`) | `src/features/auth/Register.tsx`, `AuthContext.tsx` | `tests/test_auth.py::test_register_and_login_flow`, `src/features/auth/auth.test.tsx` |
| **FR2: Student Profile Management** | Create and update student funding profiles, including bio, academic level, and funding goal. | `app/blueprints/profiles/routes.py` (`/profiles/me`) | `src/features/student/StudentProfile.tsx` | `tests/test_profiles.py::test_create_and_get_profile` |
| **FR3: Document Upload & Storage** | Upload verification documents (student IDs, transcripts, recommendation letters). | `app/blueprints/profiles/routes.py` (`/profiles/documents`) | `src/features/student/StudentDocuments.tsx` | `tests/test_profiles.py::test_document_upload_and_delete` |
| **FR4: Ambassador Assistance** | Promoted ambassadors onboard and submit student profiles from rural communities. | `app/blueprints/profiles/routes.py` (`/profiles/ambassador/enroll`) | `src/features/ambassador/AmbassadorDashboard.tsx` | `tests/test_profiles.py::test_ambassador_enroll_student` |
| **FR5: Admin Verification Engine** | Admin queue to review pending student applications, approve/reject with mandatory note, promote verified students to ambassadors. | `app/blueprints/admin/routes.py` (`/admin/profiles/<id>/approve`, `/promote-ambassador`) | `src/features/admin/AdminDashboard.tsx` | `tests/test_profiles.py::test_admin_approve_profile` |
| **FR6: Donor Portal & Proof of Funds** | Donors browse approved profiles, contribute funds directly to schools, and upload payment evidence pictures. | `app/blueprints/contributions/routes.py` (`/contributions/`) | `src/features/donor/DonorDashboard.tsx` | `tests/test_contributions.py::test_create_contribution` |
| **FR7: Process Ticketing System** | Auto-generation of official timestamped Verification/Transaction Tickets (e.g. `TICK-20260721-XXXX`) for every completed process. | `app/blueprints/tickets/routes.py` (`/tickets/`) | `src/components/TicketsView.tsx` | `tests/test_contributions.py::test_ticket_generation` |

---

## 2. Business Rules (BR1 – BR10)

| Business Rule ID | Rule Summary | Enforcement Mechanism | Automated Test ID |
|---|---|---|---|
| **BR1: Approved Visibility Gate** | Only admin-approved student profiles appear in public donor directory. | `StudentProfile.status == 'approved'` filter in `contributions/routes.py` | `test_contributions.py::test_only_approved_profiles_visible` |
| **BR2: Direct School Routing & Proof** | Contributions route directly to partner institutions with uploaded payment slip picture. | `Institution.bank_reference` + `proof_image_url` in `Contribution` model | `test_contributions.py::test_institution_bank_routing_recorded` |
| **BR3: Minor Consent Gate** | Minor students (<18) must have explicit guardian name, phone, and consent. | `guardian_consent` validation in `profiles/schemas.py` | `test_profiles.py::test_minor_profile_requires_guardian_consent` |
| **BR4: PII Privacy Protection** | Minor student full names and contact info are masked from public/donor view. | `StudentProfile.to_dict(public=True)` masks PII to "Verified Student" | `test_profiles.py::test_public_profile_pii_masking` |
| **BR5: Ambassador Ownership** | Ambassadors can only manage profiles they explicitly enrolled. | `ambassador_id == current_user.id` check in profile routes | `test_profiles.py::test_ambassador_access_control` |
| **BR6: Audit Logging** | All admin approval, rejection, and ambassador promotion actions are logged in an append-only audit trail. | `AuditLog` model inserted inside `admin/routes.py` db transaction | `test_profiles.py::test_admin_action_creates_audit_log` |
| **BR7: Mandatory Review Note** | Rejection or approval by admin requires a review note of min length 5 chars. | `ReviewSchema` validation in `admin/routes.py` | `test_profiles.py::test_review_note_validation` |
| **BR8: Process Ticket Generation** | Every completed milestone issues an official timestamped Process Ticket. | `create_process_ticket` called upon approval, promotion, and funding | `test_contributions.py::test_process_ticket_generated` |
| **BR9: Secure Password Hashing** | Passwords must use Bcrypt with cost factor 12. | `flask_bcrypt` configured in `extensions.py` | `test_auth.py::test_password_hashing_bcrypt` |
| **BR10: Offline Draft Support** | Draft profiles captured offline are queued in IndexedDB and synced on reconnect. | Frontend `lib/offline.ts` IndexedDB queue + sync service | `auth.test.tsx::offline_queue_sync` |
