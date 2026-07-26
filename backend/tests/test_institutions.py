"""Institution endpoints tests."""

def _register(client, email="s@example.com", role="student"):
    payload = {"email": email, "full_name": "Test", "password": "Passw0rd!", "role": role}
    res = client.post("/api/auth/register", json=payload)
    return res.get_json()["access"] if res.status_code == 201 else None

def _admin_token(client, app):
    with app.app_context():
        from app.models import User
        from app.extensions import db
        user = User(email="admin@example.com", full_name="Admin", role="admin")
        user.set_password("Passw0rd!")
        db.session.add(user)
        db.session.commit()
        from flask_jwt_extended import create_access_token
        return create_access_token(identity=str(user.id), additional_claims={"role": user.role})

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
        json={"name": "Kigali Tech", "location": "Kigali"}
    )
    # The route /api/profiles/institutions still exists or /api/institutions/
    # Let's test the new one
    res = client.get("/api/institutions/")
    assert res.status_code == 200
    assert len(res.get_json()["institutions"]) == 1
