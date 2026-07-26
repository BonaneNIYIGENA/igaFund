"""Contributions & public profiles API tests."""
from app.extensions import db
from app.models import User, Role, StudentProfile, ProfileStatus, Institution, Contribution


def _setup_approved_profile(client):
    # Create institution
    inst = Institution(name="Kigali High School", location="Kigali", type="Secondary")
    db.session.add(inst)
    db.session.commit()

    # Create student & profile
    res = client.post("/api/auth/register", json={
        "email": "student@example.com", "full_name": "Jean Student", "password": "Passw0rd!", "role": "student"
    })
    token = res.get_json()["access"]

    res = client.post("/api/profiles/", json={
        "bio": "Studying hard", "funding_goal": 500000, "institution_id": inst.id, "academic_level": "S6"
    }, headers={"Authorization": f"Bearer {token}"})
    pid = res.get_json()["profile"]["id"]

    # Admin approve profile
    admin_res = client.post("/api/auth/register", json={
        "email": "donor@example.com", "full_name": "Dave Donor", "password": "Passw0rd!", "role": "donor"
    })
    donor_token = admin_res.get_json()["access"]

    profile = db.session.get(StudentProfile, pid)
    profile.status = ProfileStatus.APPROVED.value
    db.session.commit()

    return pid, inst.id, donor_token


def test_public_profiles_endpoint(client):
    pid, inst_id, _ = _setup_approved_profile(client)
    res = client.get("/api/profiles/public")
    assert res.status_code == 200
    data = res.get_json()["profiles"]
    assert len(data) == 1
    assert data[0]["id"] == pid


def test_make_contribution_and_anonymity(client):
    pid, inst_id, donor_token = _setup_approved_profile(client)

    res = client.post("/api/contributions/", json={
        "profile_id": pid,
        "amount": 50000,
        "message": "Keep up the great work!",
        "is_anonymous": True,
    }, headers={"Authorization": f"Bearer {donor_token}"})

    assert res.status_code == 201
    data = res.get_json()
    assert data["funded_amount"] == 50000

    # Public list of contributions for profile
    c_res = client.get(f"/api/contributions/profile/{pid}")
    assert c_res.status_code == 200
    c_data = c_res.get_json()["contributions"]
    assert len(c_data) == 1
    assert c_data[0]["donor_name"] == "Anonymous Donor"
    assert c_data[0]["message"] == "Keep up the great work!"
    assert c_data[0]["routed_to_institution"] is True
