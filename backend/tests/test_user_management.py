"""Admin user management tests."""


def _admin_token(client, app):
    with app.test_request_context():
        from app.extensions import db
        from app.models import User, Role
        from app.common.sessions import issue_session
        admin = User(email="admin_user@example.com", full_name="Admin User", role=Role.ADMIN.value)
        admin.set_password("AdminPass123!")
        db.session.add(admin)
        db.session.commit()
        token = issue_session(admin)["access"]
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


def test_promote_student_to_ambassador(client, app):
    token, _ = _admin_token(client, app)
    target_id = _create_user(app, "promote_me@example.com", "student")

    res = client.post(
        f"/api/admin/users/{target_id}/promote-ambassador",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data["user"]["role"] == "ambassador"
    assert data["ticket"]["process_type"] == "ambassador_promoted"

    with app.app_context():
        from app.extensions import db
        from app.models import Notification
        notif = Notification.query.filter_by(user_id=target_id).first()
        assert notif is not None
        assert notif.link == "/ambassador"


def test_promote_ambassador_rejects_non_student(client, app):
    token, _ = _admin_token(client, app)
    donor_id = _create_user(app, "not_a_student@example.com", "donor")

    res = client.post(
        f"/api/admin/users/{donor_id}/promote-ambassador",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 400


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
