# Test log

## Phase 1 — Authentication (2026-07-10)

### Backend (pytest + coverage)
```
11 passed
TOTAL  207 stmts  19 miss  91% coverage
```

### Frontend (vitest)
```
Test Files  1 passed (1)
Tests       4 passed (4)
All files   55% stmts
```
Covers: login renders, login stores token, register offers the three self-service roles, role select + register. Overall % is modest this phase because only the auth flow is tested — `AuthLayout`/`Dashboard` are view-only and `api.ts` is mocked (its real behaviour is proven by the backend integration tests). Coverage rises as later phases add their own tests.

### Requirements proven this phase
| Requirement | Meaning | Test |
|---|---|---|
| FR1.1–1.3 | Student/ambassador/donor registration | `test_register_returns_tokens` |
| FR1.4 | Admin is seeded, not self-registered | `test_admin_signup_rejected` + `seed-admin` CLI |
| FR1.5 | Login + access control | `test_login_success_and_me`, `test_me_requires_auth` |
| FR1.6 | Password recovery | `test_password_reset_flow`, `test_password_reset_bad_token` |
| NFR1 | Password complexity + bcrypt | `test_weak_password_rejected`, bcrypt in `User.set_password` |
| Privacy | Reset does not leak account existence | `test_password_reset_unknown_email_still_200` |
