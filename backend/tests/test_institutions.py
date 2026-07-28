"""Institution endpoints tests."""

def _register(client, email="s@example.com", role="student"):
    payload = {"email": email, "full_name": "Test", "password": "Passw0rd!", "role": role}
    res = client.post("/api/auth/register", json=payload)
    return res.get_json()["access"] if res.status_code == 201 else None

def _admin_token(client, app):
    with app.test_request_context():
        from app.models import User
        from app.extensions import db
        user = User(email="admin@example.com", full_name="Admin", role="admin")
        user.set_password("Passw0rd!")
        db.session.add(user)
        db.session.commit()
        from app.common.sessions import issue_session
        return issue_session(user)["access"]

def test_create_institution_as_admin(client, app):
    token = _admin_token(client, app)
    res = client.post(
        "/api/institutions/",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Kigali Tech", "location": "Kigali", "type": "university"}
    )
    assert res.status_code == 201
    assert res.get_json()["institution"]["name"] == "Kigali Tech"

def test_create_institution_as_student_forbidden(client):
    token = _register(client)
    res = client.post(
        "/api/institutions/",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Kigali Tech", "location": "Kigali", "type": "university"}
    )
    assert res.status_code == 403

def test_list_institutions(client, app):
    token = _admin_token(client, app)
    client.post(
        "/api/institutions/",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Kigali Tech", "location": "Kigali", "bank_reference": "BK-9988776655"}
    )

    assert client.get("/api/institutions/").status_code == 401

    res = client.get("/api/institutions/", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    rows = res.get_json()["institutions"]
    assert len(rows) == 1
    assert rows[0]["applicants"] == 0
    assert rows[0]["total_routed"] == 0


def test_institution_detail_masks_bank_reference_from_non_admins(client, app):
    """Donors see where money goes without seeing a reusable account number."""
    admin = _admin_token(client, app)
    created = client.post(
        "/api/institutions/",
        headers={"Authorization": f"Bearer {admin}"},
        json={"name": "Kigali Tech", "location": "Kigali", "bank_reference": "BK-9988776655"}
    ).get_json()["institution"]

    as_admin = client.get(
        f"/api/institutions/{created['id']}", headers={"Authorization": f"Bearer {admin}"}
    ).get_json()["institution"]
    assert as_admin["bank_reference"] == "BK-9988776655"

    student = _register(client)
    as_student = client.get(
        f"/api/institutions/{created['id']}", headers={"Authorization": f"Bearer {student}"}
    ).get_json()["institution"]
    assert as_student["bank_reference"].endswith("6655")
    assert "BK-99887" not in as_student["bank_reference"]
