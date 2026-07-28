"""Session security: idle timeout, sign-out revocation, admin concurrency cap."""
from datetime import datetime, timedelta, timezone


def _register(client, **over):
    payload = {"email": "s@example.com", "full_name": "Sam", "password": "Passw0rd!", "role": "student"}
    payload.update(over)
    return client.post("/api/auth/register", json=payload)


def _make_admin(app, email="admin@example.com", password="Passw0rd!"):
    with app.app_context():
        from app.extensions import db
        from app.models import User, Role
        user = User(email=email, full_name="Admin", role=Role.ADMIN.value)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()


def test_logout_revokes_session(client):
    token = _register(client).get_json()["access"]
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code == 200

    logout = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout.status_code == 200

    blocked = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert blocked.status_code == 401
    assert blocked.get_json()["code"] == "session_expired"


def test_idle_session_is_blocked(client, app):
    token = _register(client).get_json()["access"]

    with app.app_context():
        from app.extensions import db
        from app.models import UserSession
        session = UserSession.query.first()
        session.last_used_at = datetime.now(timezone.utc) - timedelta(hours=25)
        db.session.commit()

    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401
    assert res.get_json()["code"] == "session_expired"


def test_refresh_touches_session_and_keeps_it_alive(client):
    tokens = _register(client).get_json()
    refresh_token = tokens["refresh"]

    res = client.post("/api/auth/refresh", headers={"Authorization": f"Bearer {refresh_token}"})
    assert res.status_code == 200
    new_access = res.get_json()["access"]
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {new_access}"}).status_code == 200


def test_admin_login_caps_at_one_concurrent_session(client, app):
    _make_admin(app)
    first = client.post("/api/auth/login", json={"email": "admin@example.com", "password": "Passw0rd!"})
    first_token = first.get_json()["access"]
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {first_token}"}).status_code == 200

    second = client.post("/api/auth/login", json={"email": "admin@example.com", "password": "Passw0rd!"})
    second_token = second.get_json()["access"]

    # The first session is revoked the moment the second login issues a new one.
    stale = client.get("/api/auth/me", headers={"Authorization": f"Bearer {first_token}"})
    assert stale.status_code == 401
    assert stale.get_json()["code"] == "session_expired"

    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {second_token}"}).status_code == 200


def test_non_admin_login_does_not_revoke_other_sessions(client):
    _register(client)
    first = client.post("/api/auth/login", json={"email": "s@example.com", "password": "Passw0rd!"})
    first_token = first.get_json()["access"]

    second = client.post("/api/auth/login", json={"email": "s@example.com", "password": "Passw0rd!"})
    second_token = second.get_json()["access"]

    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {first_token}"}).status_code == 200
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {second_token}"}).status_code == 200
