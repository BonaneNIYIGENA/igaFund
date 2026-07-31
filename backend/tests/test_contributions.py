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

    # Registration already created a draft profile; fill it in via PUT.
    mine = client.get("/api/profiles/", headers={"Authorization": f"Bearer {token}"})
    pid = mine.get_json()["profiles"][0]["id"]
    client.put(f"/api/profiles/{pid}", json={
        "bio": "Studying hard", "funding_goal": 500000, "institution_id": inst.id, "academic_level": "S6"
    }, headers={"Authorization": f"Bearer {token}"})

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
        "proof_image_url": "https://res.cloudinary.com/demo/image/upload/slip.jpg",
    }, headers={"Authorization": f"Bearer {donor_token}"})

    assert res.status_code == 201
    data = res.get_json()
    assert data["funded_amount"] == 50000

    # The donor who gave sees their own contribution in full.
    c_res = client.get(f"/api/contributions/profile/{pid}", headers={"Authorization": f"Bearer {donor_token}"})
    assert c_res.status_code == 200
    c_data = c_res.get_json()["contributions"]
    assert len(c_data) == 1
    assert c_data[0]["donor_name"] == "Anonymous Donor"
    assert c_data[0]["message"] == "Keep up the great work!"
    assert c_data[0]["routed_to_institution"] is True


def test_contribution_records_are_not_public(client):
    """BR6/NFR3: financial records are not readable by anonymous callers."""
    pid, _, donor_token = _setup_approved_profile(client)
    client.post("/api/contributions/", json={
        "profile_id": pid, "amount": 50000,
        "proof_image_url": "https://res.cloudinary.com/demo/image/upload/slip.jpg",
    }, headers={"Authorization": f"Bearer {donor_token}"})

    assert client.get(f"/api/contributions/profile/{pid}").status_code == 401


def test_other_donors_cannot_read_receipt_references(client):
    """A signed-in bystander sees support exists, not the financial trail."""
    pid, _, donor_token = _setup_approved_profile(client)
    client.post("/api/contributions/", json={
        "profile_id": pid, "amount": 50000, "message": "Go well",
        "proof_image_url": "https://res.cloudinary.com/demo/image/upload/slip.jpg",
    }, headers={"Authorization": f"Bearer {donor_token}"})

    client.post("/api/auth/register", json={
        "email": "other@example.com", "full_name": "Other Donor", "password": "Passw0rd!", "role": "donor"
    })
    other = client.post("/api/auth/login", json={"email": "other@example.com", "password": "Passw0rd!"}).get_json()["access"]

    res = client.get(f"/api/contributions/profile/{pid}", headers={"Authorization": f"Bearer {other}"})
    assert res.status_code == 200
    row = res.get_json()["contributions"][0]
    assert row["message"] == "Go well"
    assert "receipt_ref" not in row
    assert "proof_image_url" not in row
    assert "donor_id" not in row


def test_public_profile_detail_is_reachable_and_masked(client):
    """Donors need a detail view; approval gates it and PII stays hidden (BR1, BR6)."""
    pid, _, _ = _setup_approved_profile(client)

    res = client.get(f"/api/profiles/public/{pid}")
    assert res.status_code == 200
    profile = res.get_json()["profile"]
    assert profile["id"] == pid
    assert "phone" not in profile
    assert "guardian_name" not in profile

    # An unapproved profile must not be reachable through the public route.
    from app.extensions import db
    from app.models import StudentProfile, ProfileStatus

    p = db.session.get(StudentProfile, pid)
    p.status = ProfileStatus.PENDING.value
    db.session.commit()
    assert client.get(f"/api/profiles/public/{pid}").status_code == 404


def test_institution_payment_reference_hidden_from_anonymous_visible_to_donor(client):
    """A donor about to contribute needs the routing account; an anonymous
    browser never should (it's not PII, but it's not public marketing copy either)."""
    pid, inst_id, donor_token = _setup_approved_profile(client)
    inst = db.session.get(Institution, inst_id)
    inst.bank_reference = "BK-TEST-99001"
    db.session.commit()

    anon_res = client.get(f"/api/profiles/public/{pid}")
    assert anon_res.status_code == 200
    assert "bank_reference" not in anon_res.get_json()["profile"]["institution"]

    donor_res = client.get(
        f"/api/profiles/public/{pid}", headers={"Authorization": f"Bearer {donor_token}"}
    )
    assert donor_res.status_code == 200
    assert donor_res.get_json()["profile"]["institution"]["bank_reference"] == "BK-TEST-99001"


def test_contribution_requires_payment_proof(client):
    """FR4.3: a contribution cannot be recorded without evidence of the transfer."""
    pid, _, donor_token = _setup_approved_profile(client)

    res = client.post("/api/contributions/", json={"profile_id": pid, "amount": 50000},
                      headers={"Authorization": f"Bearer {donor_token}"})
    assert res.status_code == 400
    assert "proof_image_url" in res.get_json()["errors"]
