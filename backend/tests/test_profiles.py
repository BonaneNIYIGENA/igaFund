"""Profile workflow tests."""


def _register_student(client, email="student@test.com"):
    return client.post("/api/auth/register", json={
        "email": email, "full_name": "Test Student", "password": "Passw0rd!", "role": "student"
    })


def _register_admin(client, app):
    with app.app_context():
        from app.models import User, Role
        from app.extensions import db
        u = User(email="admin@test.com", full_name="Admin", role=Role.ADMIN.value)
        u.set_password("Admin123!")
        db.session.add(u)
        db.session.commit()
    login = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "Admin123!"})
    return login.get_json()["access"]


def _auth(client, email="student@test.com"):
    login = client.post("/api/auth/login", json={"email": email, "password": "Passw0rd!"})
    return login.get_json()["access"]


def _create_profile(client, token, **overrides):
    data = {"bio": "I love learning.", "academic_level": "S4", "funding_goal": 500000}
    data.update(overrides)
    return client.post("/api/profiles/", json=data, headers={"Authorization": f"Bearer {token}"})


# ── Profile CRUD ─────────────────────────────────────────

def test_create_profile(client):
    _register_student(client)
    token = _auth(client)
    res = _create_profile(client, token)
    assert res.status_code == 201
    assert res.get_json()["profile"]["status"] == "draft"


def test_duplicate_profile_rejected(client):
    _register_student(client)
    token = _auth(client)
    _create_profile(client, token)
    res = _create_profile(client, token)
    assert res.status_code == 409


def test_update_draft_profile(client):
    _register_student(client)
    token = _auth(client)
    pid = _create_profile(client, token).get_json()["profile"]["id"]
    res = client.put(f"/api/profiles/{pid}", json={"bio": "Updated bio"}, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.get_json()["profile"]["bio"] == "Updated bio"


def test_list_own_profiles(client):
    _register_student(client)
    token = _auth(client)
    _create_profile(client, token)
    res = client.get("/api/profiles/", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert len(res.get_json()["profiles"]) == 1


# ── Submission workflow ──────────────────────────────────

def test_submit_profile(client):
    _register_student(client)
    token = _auth(client)
    pid = _create_profile(client, token, date_of_birth="2005-01-01", guardian_consent=True).get_json()["profile"]["id"]
    res = client.post(f"/api/profiles/{pid}/submit", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.get_json()["profile"]["status"] == "pending"


def test_minor_needs_guardian_consent(client):
    _register_student(client)
    token = _auth(client)
    pid = _create_profile(client, token, date_of_birth="2015-01-01", guardian_consent=False).get_json()["profile"]["id"]
    res = client.post(f"/api/profiles/{pid}/submit", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 400
    assert "guardian" in res.get_json()["error"].lower()


def test_cannot_edit_submitted_profile(client):
    _register_student(client)
    token = _auth(client)
    pid = _create_profile(client, token, date_of_birth="2005-01-01", guardian_consent=True).get_json()["profile"]["id"]
    client.post(f"/api/profiles/{pid}/submit", headers={"Authorization": f"Bearer {token}"})
    res = client.put(f"/api/profiles/{pid}", json={"bio": "hack"}, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 400


# ── Admin verification ───────────────────────────────────

def test_admin_approve(client, app):
    _register_student(client)
    token = _auth(client)
    pid = _create_profile(client, token, date_of_birth="2005-01-01", guardian_consent=True).get_json()["profile"]["id"]
    client.post(f"/api/profiles/{pid}/submit", headers={"Authorization": f"Bearer {token}"})

    admin_token = _register_admin(client, app)
    res = client.post(f"/api/admin/profiles/{pid}/approve", json={"note": "Documents verified."}, headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    assert res.get_json()["profile"]["status"] == "approved"


def test_admin_reject(client, app):
    _register_student(client)
    token = _auth(client)
    pid = _create_profile(client, token, date_of_birth="2005-01-01", guardian_consent=True).get_json()["profile"]["id"]
    client.post(f"/api/profiles/{pid}/submit", headers={"Authorization": f"Bearer {token}"})

    admin_token = _register_admin(client, app)
    res = client.post(f"/api/admin/profiles/{pid}/reject", json={"note": "Missing transcript."}, headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    assert res.get_json()["profile"]["status"] == "rejected"


def test_approve_needs_note(client, app):
    _register_student(client)
    token = _auth(client)
    pid = _create_profile(client, token, date_of_birth="2005-01-01", guardian_consent=True).get_json()["profile"]["id"]
    client.post(f"/api/profiles/{pid}/submit", headers={"Authorization": f"Bearer {token}"})

    admin_token = _register_admin(client, app)
    res = client.post(f"/api/admin/profiles/{pid}/approve", json={}, headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 400


def test_non_admin_cannot_approve(client):
    _register_student(client)
    token = _auth(client)
    pid = _create_profile(client, token, date_of_birth="2005-01-01", guardian_consent=True).get_json()["profile"]["id"]
    client.post(f"/api/profiles/{pid}/submit", headers={"Authorization": f"Bearer {token}"})
    res = client.post(f"/api/admin/profiles/{pid}/approve", json={"note": "hack"}, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403
