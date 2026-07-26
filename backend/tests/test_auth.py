"""Auth flow tests."""


def _register(client, **over):
    payload = {"email": "s@example.com", "full_name": "Sam", "password": "Passw0rd!", "role": "student"}
    payload.update(over)
    return client.post("/api/auth/register", json=payload)


def test_register_returns_tokens(client):
    res = _register(client)
    assert res.status_code == 201
    assert "access" in res.get_json()


def test_duplicate_email_rejected(client):
    _register(client)
    assert _register(client).status_code == 409


def test_weak_password_rejected(client):
    assert _register(client, password="weak").status_code == 400


def test_invalid_role_rejected(client):
    assert _register(client, role="hacker").status_code == 400


def test_login_success_and_me(client):
    _register(client)
    login = client.post("/api/auth/login", json={"email": "s@example.com", "password": "Passw0rd!"})
    assert login.status_code == 200
    token = login.get_json()["access"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.get_json()["user"]["email"] == "s@example.com"


def test_login_wrong_password(client):
    _register(client)
    res = client.post("/api/auth/login", json={"email": "s@example.com", "password": "Nope1234!"})
    assert res.status_code == 401


def test_me_requires_auth(client):
    assert client.get("/api/auth/me").status_code == 401


def test_admin_signup_rejected(client):
    assert _register(client, role="admin").status_code == 400


def test_password_reset_flow(client, app):
    _register(client)
    req = client.post("/api/auth/password-reset/request", json={"email": "s@example.com"})
    assert req.status_code == 200
    with app.app_context():
        from app.common.tokens import make_reset_token
        from app.models import User
        token = make_reset_token(User.query.filter_by(email="s@example.com").first().id)
    confirm = client.post("/api/auth/password-reset/confirm", json={"token": token, "password": "NewPass1!"})
    assert confirm.status_code == 200
    login = client.post("/api/auth/login", json={"email": "s@example.com", "password": "NewPass1!"})
    assert login.status_code == 200


def test_password_reset_bad_token(client):
    res = client.post("/api/auth/password-reset/confirm", json={"token": "garbage", "password": "NewPass1!"})
    assert res.status_code == 400


def test_password_reset_unknown_email_still_200(client):
    res = client.post("/api/auth/password-reset/request", json={"email": "nobody@example.com"})
    assert res.status_code == 200
