"""Audit endpoints tests."""

def _register(client, email="s@example.com", role="student"):
    payload = {"email": email, "full_name": "Test", "password": "Passw0rd!", "role": role}
    res = client.post("/api/auth/register", json=payload)
    return res.get_json()["access"] if res.status_code == 201 else None

def _admin_token(client, app):
    with app.app_context():
        from app.models import User
        from app.extensions import db
        user = User.query.filter_by(role="admin").first()
        if not user:
            user = User(email="admin@example.com", full_name="Admin", role="admin")
            user.set_password("Passw0rd!")
            db.session.add(user)
            db.session.commit()
        from flask_jwt_extended import create_access_token
        return create_access_token(identity=str(user.id), additional_claims={"role": user.role})

def test_list_audit_logs_as_admin(client, app):
    token = _admin_token(client, app)
    res = client.get("/api/audit/", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert "audit_logs" in res.get_json()

def test_list_audit_logs_as_student_forbidden(client):
    token = _register(client)
    res = client.get("/api/audit/", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403
