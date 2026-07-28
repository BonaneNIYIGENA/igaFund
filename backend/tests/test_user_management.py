"""Admin user management tests."""


def _admin_token(client, app):
    with app.app_context():
        from app.extensions import db
        from app.models import User, Role
        from flask_jwt_extended import create_access_token
        admin = User(email="admin_user@example.com", full_name="Admin User", role=Role.ADMIN.value)
        admin.set_password("AdminPass123!")
        db.session.add(admin)
        db.session.commit()
        token = create_access_token(identity=str(admin.id), additional_claims={"role": Role.ADMIN.value})
        return token, admin.id


def _create_user(app, email="student_test@example.com", role="student"):
    with app.app_context():
        from app.extensions import db
        from app.models import User
        u = User(email=email, full_name="Test Student", role=role)
        u.set_password("StudentPass123!")
        db.session.add(u)
        db.session.commit()
        return u.id


def test_list_users_as_admin(client, app):
    token, _ = _admin_token(client, app)
    _create_user(app, "u1@example.com", "student")
    _create_user(app, "u2@example.com", "donor")

    res = client.get("/api/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.get_json()
    assert "users" in data
    assert data["total"] >= 3


def test_change_user_role(client, app):
    token, _ = _admin_token(client, app)
    target_id = _create_user(app, "student_to_ambassador@example.com", "student")

    res = client.put(
        f"/api/admin/users/{target_id}/role",
        headers={"Authorization": f"Bearer {token}"},
        json={"role": "ambassador"},
    )
    assert res.status_code == 200
    assert res.get_json()["user"]["role"] == "ambassador"


def test_toggle_suspend_user(client, app):
    token, _ = _admin_token(client, app)
    target_id = _create_user(app, "suspend_me@example.com", "donor")

    # Suspend
    suspend_res = client.post(
        f"/api/admin/users/{target_id}/suspend",
        headers={"Authorization": f"Bearer {token}"},
        json={"note": "Suspended for providing false identification details"},
    )
    assert suspend_res.status_code == 200
    assert suspend_res.get_json()["user"]["is_suspended"] is True

    # Unsuspend
    unsuspend_res = client.post(
        f"/api/admin/users/{target_id}/suspend",
        headers={"Authorization": f"Bearer {token}"},
        json={"note": "Verified identity and reactivated account"},
    )
    assert unsuspend_res.status_code == 200
    assert unsuspend_res.get_json()["user"]["is_suspended"] is False
