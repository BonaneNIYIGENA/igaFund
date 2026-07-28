"""Donor watchlist and ticket visibility tests."""
from app.extensions import db
from app.models import User, Role, StudentProfile, ProfileStatus, Institution


def _register(client, email, role):
    res = client.post("/api/auth/register", json={
        "email": email, "full_name": "Test User", "password": "Passw0rd!", "role": role,
    })
    return res.get_json()["access"]


def _approved_profile(client):
    inst = Institution(name="Test School", location="Kigali", type="secondary")
    db.session.add(inst)
    db.session.commit()

    token = _register(client, "student_wl@example.com", "student")
    res = client.post("/api/profiles/", json={
        "bio": "Studying hard", "funding_goal": 500000, "institution_id": inst.id, "academic_level": "S6",
    }, headers={"Authorization": f"Bearer {token}"})
    pid = res.get_json()["profile"]["id"]

    profile = db.session.get(StudentProfile, pid)
    profile.status = ProfileStatus.APPROVED.value
    db.session.commit()
    return pid


def test_donor_can_follow_and_unfollow_a_verified_profile(client):
    pid = _approved_profile(client)
    donor = _register(client, "donor_wl@example.com", "donor")

    res = client.post(f"/api/profiles/{pid}/watch", headers={"Authorization": f"Bearer {donor}"})
    assert res.status_code == 201
    assert res.get_json()["watching"] is True

    listed = client.get("/api/profiles/watching", headers={"Authorization": f"Bearer {donor}"})
    assert listed.status_code == 200
    assert pid in listed.get_json()["watched_ids"]

    unwatch = client.delete(f"/api/profiles/{pid}/watch", headers={"Authorization": f"Bearer {donor}"})
    assert unwatch.status_code == 200
    assert unwatch.get_json()["watching"] is False

    listed_again = client.get("/api/profiles/watching", headers={"Authorization": f"Bearer {donor}"})
    assert pid not in listed_again.get_json()["watched_ids"]


def test_cannot_follow_an_unverified_profile(client):
    token = _register(client, "student_wl2@example.com", "student")
    inst = Institution(name="Another School", location="Kigali", type="secondary")
    db.session.add(inst)
    db.session.commit()
    created = client.post("/api/profiles/", json={
        "bio": "Studying hard", "funding_goal": 400000, "institution_id": inst.id, "academic_level": "S5",
    }, headers={"Authorization": f"Bearer {token}"})
    pid = created.get_json()["profile"]["id"]

    donor = _register(client, "donor_wl2@example.com", "donor")
    res = client.post(f"/api/profiles/{pid}/watch", headers={"Authorization": f"Bearer {donor}"})
    assert res.status_code == 404


def test_non_donor_cannot_follow(client):
    pid = _approved_profile(client)
    other_student = _register(client, "other_student_wl@example.com", "student")
    res = client.post(f"/api/profiles/{pid}/watch", headers={"Authorization": f"Bearer {other_student}"})
    assert res.status_code == 403


def test_tickets_are_admin_only(client, app):
    pid = _approved_profile(client)
    donor = _register(client, "donor_wl3@example.com", "donor")
    student_res = client.get("/api/profiles/", headers={"Authorization": f"Bearer {donor}"})
    assert student_res.status_code == 200

    assert client.get("/api/tickets/", headers={"Authorization": f"Bearer {donor}"}).status_code == 403

    with app.app_context():
        admin = User(email="ticket_admin@example.com", full_name="Admin", role=Role.ADMIN.value)
        admin.set_password("Passw0rd!")
        db.session.add(admin)
        db.session.commit()
    admin_token = client.post("/api/auth/login", json={
        "email": "ticket_admin@example.com", "password": "Passw0rd!",
    }).get_json()["access"]

    assert client.get("/api/tickets/", headers={"Authorization": f"Bearer {admin_token}"}).status_code == 200
