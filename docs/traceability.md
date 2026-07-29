# igaFund — Requirements Traceability Matrix

Maps every Functional Requirement (FR1–FR7) and Business Rule (BR1–BR10) from the SRS
(`Bonane_NIYIGENA_[Assignment2]_ [06292026].pdf`) to the API endpoint, frontend screen and
automated test that satisfies it.

Endpoints are given exactly as registered; every path below is prefixed with `/api`.

---

## 1. Functional Requirements (FR1 – FR7)

| ID | Description | Backend endpoint | Frontend | Tests |
|---|---|---|---|---|
| **FR1.1–1.4** Registration | Students and donors self-register; admins are seeded; ambassadors are promoted. | `POST /auth/register` (`blueprints/auth/routes.py`), `POST /admin/users/<id>/promote-ambassador` | `features/auth/Register.tsx` | `test_auth.py::test_register_and_login_flow`, `auth.test.tsx` |
| **FR1.5** Login & access control | JWT login with role claim; each role lands on its own home. | `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`, `common/decorators.py::role_required` | `features/auth/Login.tsx`, `features/auth/guard.tsx` | `test_auth.py::test_login_*`, `test_auth.py::test_rbac_denies_non_admin` |
| **FR1.6** Password recovery | Signed, 30-minute reset token emailed as a clickable link; the request step confirms whether the email is registered before sending. | `POST /auth/password-reset/request`, `POST /auth/password-reset/confirm` | `ForgotPassword.tsx`, `ResetPassword.tsx` | `test_auth.py::test_password_reset_flow` |
| **FR1.7** Account self-service | Every role can update their name/email, change their password, toggle email notifications, and sign out (which revokes the session server-side). | `PUT /auth/me`, `POST /auth/logout` | `features/settings/AccountSettings.tsx` (mounted at `/<role>/settings` for all four roles) | `test_user_management.py`, `test_sessions.py::test_logout_revokes_session` |
| **FR2.1** Profile creation | Student self-creates, or an ambassador creates on their behalf. | `POST /profiles/` | `student/StudentProfile.tsx`, `ambassador/AmbassadorEnroll.tsx` | `test_profiles.py::test_create_profile`, `::test_ambassador_can_submit_the_profile_they_enrolled` |
| **FR2.2** Document upload | Transcript, ID, recommendation, guardian consent. | `POST /profiles/<id>/documents`, `GET /profiles/<id>/documents`, `DELETE /profiles/<id>/documents/<doc_id>` | `student/StudentDocuments.tsx`, `ambassador/AmbassadorDocuments.tsx` | `test_profiles.py::test_document_is_served_only_to_authorised_viewers` |
| **FR2.2b** Document review access | Reviewers open the actual file through a JWT-guarded route (no public URL — NFR2). | `GET /profiles/<id>/documents/<doc_id>/file`, `POST /profiles/<id>/documents/<doc_id>/verify` | `features/documents/DocumentViewer.tsx` | `test_profiles.py::test_document_is_served_only_to_authorised_viewers` |
| **FR2.3** Profile edits | Editable while draft or rejected; approved profiles need a change request (BR4). | `PUT /profiles/<id>`, `POST /profiles/<id>/request-edit` | `student/StudentProfile.tsx` | `test_profiles.py::test_cannot_edit_submitted_profile`, `::test_rejected_profile_can_be_fixed_and_resubmitted`, `::test_approved_profile_is_locked_until_change_requested` |
| **FR2.4** Funding progress | Raised vs goal, supporters and their messages. | `GET /profiles/`, `GET /contributions/profile/<id>` | `student/StudentDashboard.tsx`, `components/ui/Progress.tsx` | `test_contributions.py::test_make_contribution_and_anonymity` |
| **FR2.5** Status notifications | In-app notification on submission, approval, rejection and funding. | `GET /notifications/`, `POST /notifications/<id>/read`, `POST /notifications/read-all` | `app/shell/NotificationCenter.tsx` (all four roles) | covered via `test_profiles.py::test_admin_approve` |
| **FR2.6** Student dashboard | Status, funding, next action, verification journey. | `GET /profiles/`, `GET /tickets/` | `student/StudentDashboard.tsx`, `student/StudentProfile.tsx` (Progress tab) | `test_profiles.py::test_list_own_profiles` |
| **FR3.1** Administrative review | Approve or reject with a mandatory note. | `GET /admin/profiles`, `GET /admin/profiles/<id>`, `POST /admin/profiles/<id>/approve`, `POST /admin/profiles/<id>/reject` | `admin/AdminQueue.tsx`, `admin/ReviewDialog.tsx` | `test_profiles.py::test_admin_approve`, `::test_admin_reject` |
| **FR3.2** Guardian consent verification | Consent flag, guardian contact and a *verified* consent document all required. | `admin/routes.py::_minor_consent_blockers` | `admin/ReviewDialog.tsx` | `test_profiles.py::test_minor_cannot_be_approved_without_verified_consent` |
| **FR3.3** RBAC | Each role reaches only its own data. | `common/decorators.py::role_required`, per-route ownership checks | `features/auth/guard.tsx` | `test_profiles.py::test_non_admin_cannot_approve`, `::test_ambassador_cannot_touch_other_ambassadors_profiles` |
| **FR3.4** Admin dashboard & audit | Queue, analytics, institutions, audit trail. | `GET /admin/stats`, `GET /audit/`, `GET /institutions/`, `POST /institutions/` | `admin/AdminDashboard.tsx`, `AdminAnalytics.tsx`, `AdminInstitutions.tsx`, `AdminAudit.tsx` | `test_audit.py::test_list_audit_logs_as_admin`, `test_institutions.py` |
| **FR4.1** Browse verified profiles | Public list and public detail, both approved-only. Detail opens as a side panel over the list, not a separate page. | `GET /profiles/public`, `GET /profiles/public/<id>` | `browse/BrowseStudents.tsx`, `browse/StudentPanel.tsx`, `donor/DonorBrowse.tsx` | `test_contributions.py::test_public_profiles_endpoint`, `::test_public_profile_detail_is_reachable_and_masked` |
| **FR4.2** Direct institution payment | Contribution bound to the student's registered institution. | `POST /contributions/` | `donor/ContributeDialog.tsx` | `test_contributions.py::test_make_contribution_and_anonymity` |
| **FR4.3** Payment evidence | Donor records a link to their payment slip with the contribution. | `POST /contributions/` (`proof_image_url`) | `donor/ContributeDialog.tsx` | `test_contributions.py::test_make_contribution_and_anonymity` |
| **FR4.4/4.5** Donation tracking & donor dashboard | History, receipts, suggested students, and a watchlist of students the donor follows. | `GET /contributions/my`, `GET /tickets/`, `POST/DELETE /profiles/<id>/watch`, `GET /profiles/watching` | `donor/DonorDashboard.tsx`, `donor/DonorGiving.tsx` (Contributions + Following tabs), `donor/FollowButton.tsx` | `test_contributions.py::test_make_contribution_and_anonymity`, `test_watchlist.py` |
| **FR5.1** Email notifications | SMTP when configured, console in development. | `common/mailer.py::send_email` (wired to password reset) | — | `test_auth.py::test_password_reset_flow` |
| **FR5.2** System alerts | In-app alerts for pending actions and milestones. | `models/notification.py`, emitted on submit / approve / reject / fund | `app/shell/NotificationCenter.tsx` | covered via approval tests |
| **FR6.1–6.3** Offline capture & sync | Enrolments captured offline are queued and replayed in order on reconnect. | replays to `POST /profiles/` | `lib/offline.ts`, `app/App.tsx::OfflineSync`, `ambassador/AmbassadorEnroll.tsx` | manual; see `docs/testing/` |
| **FR7.1/7.2** Analytics | Verification outcomes, applications over time, funds routed per institution. | `GET /admin/stats`, `GET /admin/profiles?status=all` | `admin/AdminAnalytics.tsx` | `test_profiles.py::test_admin_approve` (data source) |
| **FR7.3** Report export | PDF summary of users, profiles and funds. | `GET /admin/export-pdf` | `admin/AdminDashboard.tsx`, `AdminAnalytics.tsx` | manual |

---

## 2. Business Rules (BR1 – BR10)

| ID | Rule | Enforced by | Test |
|---|---|---|---|
| **BR1** | Only approved profiles are publicly browsable. | `status == approved` filter in `profiles/routes.py::list_public_profiles` and `get_public_profile` | `test_contributions.py::test_public_profiles_endpoint`, `::test_public_profile_detail_is_reachable_and_masked` |
| **BR2** | Contributions route only to the student's registered institution. | `Contribution.institution_id` taken from the profile; contribution refused when no institution is set (`contributions/routes.py`) | `test_contributions.py::test_make_contribution_and_anonymity` |
| **BR3** | Minors need signed, verified guardian consent before publication. | `profiles/routes.py::submit_profile` at submission **and** `admin/routes.py::_minor_consent_blockers` at approval | `test_profiles.py::test_minor_needs_guardian_consent`, `::test_minor_cannot_be_approved_without_verified_consent` |
| **BR4** | Approved profiles are immutable; changes reopen a review cycle. | `PUT /profiles/<id>` returns 409 `edit_request_required`; `POST /profiles/<id>/request-edit` sets status back to pending with a stated reason | `test_profiles.py::test_approved_profile_is_locked_until_change_requested` |
| **BR5** | Ambassadors manage only students they enrolled. | `profiles/routes.py::_can_manage` (`ambassador_id == current user`) | `test_profiles.py::test_ambassador_can_submit_the_profile_they_enrolled`, `::test_ambassador_cannot_touch_other_ambassadors_profiles` |
| **BR6** | Donors see published information only, never confidential records. | `StudentProfile.to_dict(public=True)` masks PII; `contributions/routes.py` withholds receipt refs, proof images and donor ids from bystanders | `test_contributions.py::test_other_donors_cannot_read_receipt_references`, `::test_contribution_records_are_not_public` |
| **BR7** | Every administrative action carries a mandatory written note. | `ReviewSchema` (min 5 chars) in `admin/routes.py` | `test_profiles.py::test_approve_needs_note` |
| **BR8** | Roles comply with platform policy. | RBAC decorator plus per-route ownership checks | `test_profiles.py::test_non_admin_cannot_approve` |
| **BR9** | Immutable audit records for verification and financial activity. | `AuditLog` written inside the approval/rejection/promotion transaction; no update or delete route exists | `test_audit.py::test_list_audit_logs_as_admin` |
| **BR10** | Submitted information passes an administrative verification layer. | No profile reaches `approved` without an admin decision | `test_profiles.py::test_admin_approve` |

---

## 3. Requirements closed since the initial gap analysis

Recorded honestly, in the order each was closed, rather than silently rewriting history.

| Requirement | What was built |
|---|---|
| **FR5.1** email on status change | Wired to welcome, approval, rejection, funding, and password reset via `common/email_templates.py`. |
| **FR1.4** full user management | Admin user list (`GET /admin/users`), role editor (`PUT /admin/users/<id>/role`), and account suspension (`POST /admin/users/<id>/suspend`) with mandatory audit notes (`features/admin/AdminUsers.tsx`). |
| **NFR4** audit completeness | `ip_address` column tracked for authentication events (login, register), administrative decisions (approve, reject, suspend, promote), and financial transactions (contributions). |
| **FR4.3** receipt upload | Dedicated `POST /contributions/proof` file upload endpoint supporting PDF, PNG, JPG with signature verification, stored in `igafund/receipts/`. |
| **§5.4** session security | Server-side `UserSession` table (`models/user_session.py`) backs a JWT blocklist loader: 24h idle timeout, immediate revocation on `POST /auth/logout`, and a single concurrent session enforced for admin accounts on login (`common/sessions.py`). |
| **FR6.2** local encrypted storage | The IndexedDB draft queue is encrypted at rest with a non-extractable AES-GCM key generated via Web Crypto and stored only inside IndexedDB (`lib/offline.ts`); plaintext drafts never touch disk. |
| **NFR4** audit trail export | `GET /audit/export-pdf` (admin-only) renders the full append-only audit trail as a paginated, branded PDF (`blueprints/audit/routes.py`), exposed via the Export PDF button on the Audit trail page. |

## 4. Known gaps (still open)

| Requirement | What is missing |
|---|---|
| **FR7.1** funding over time | Charts use profile creation dates. Month-by-month *funding* totals need a reporting endpoint exposing per-contribution timestamps. |
| i18n coverage | Kinyarwanda translates every page's title/description header and each dashboard's hero status card, but not deeper form content (field labels, hints, table headers). English-only there. |
