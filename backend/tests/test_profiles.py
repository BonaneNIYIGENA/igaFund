"""Profile workflow tests."""


def _register_student(client, email="student@test.com"):
    return client.post("/api/auth/register", json={
        "email": email, "full_name": "Test Student", "password": "Passw0rd!", "role": "student"
    })


def _register_admin(client, app):
    with app.app_context():
        from app.models import User, Role
        from app.extensions import db
        u = User(email="admin@test.com", full_name="Admin", role=Role.ADMIN.value)
        u.set_password("Admin123!")
        db.session.add(u)
        db.session.commit()
    login = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "Admin123!"})
    return login.get_json()["access"]


def _auth(client, email="student@test.com"):
    login = client.post("/api/auth/login", json={"email": email, "password": "Passw0rd!"})
    return login.get_json()["access"]


def _create_profile(client, token, **overrides):
    """Registration auto-creates a draft profile (with the student's DOB), so
    completing it is a PUT against that existing row, not a POST — mirrors
    what the frontend actually does now that `profile` is never null."""
    data = {"bio": "I love learning.", "academic_level": "S4", "funding_goal": 500000}
    data.update(overrides)
    mine = client.get("/api/profiles/", headers={"Authorization": f"Bearer {token}"})
    pid = mine.get_json()["profiles"][0]["id"]
    return client.put(f"/api/profiles/{pid}", json=data, headers={"Authorization": f"Bearer {token}"})


# ── Profile CRUD ─────────────────────────────────────────

def test_create_profile(client):
    _register_student(client)
    token = _auth(client)
    res = _create_profile(client, token)
    assert res.status_code == 200
    assert res.get_json()["profile"]["status"] == "draft"


def test_duplicate_profile_rejected(client):
    _register_student(client)
    token = _auth(client)
    # Registration already created a draft profile; a second POST must still
    # be rejected — one profile per student is an invariant, not just a UX default.
    res = client.post(
        "/api/profiles/",
        json={"bio": "I love learning.", "academic_level": "S4", "funding_goal": 500000},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 409


def test_update_draft_profile(client):
    _register_student(client)
    token = _auth(client)
    pid = _create_profile(client, token).get_json()["profile"]["id"]
    res = client.put(f"/api/profiles/{pid}", json={"bio": "Updated bio"}, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.get_json()["profile"]["bio"] == "Updated bio"


def test_list_own_profiles(client):
    _register_student(client)
    token = _auth(client)
    _create_profile(client, token)
    res = client.get("/api/profiles/", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert len(res.get_json()["profiles"]) == 1


# ── Submission workflow ──────────────────────────────────

def test_submit_profile(client):
    _register_student(client)
    token = _auth(client)
    pid = _create_profile(client, token, date_of_birth="2005-01-01", guardian_consent=True).get_json()["profile"]["id"]
    res = client.post(f"/api/profiles/{pid}/submit", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.get_json()["profile"]["status"] == "pending"


def test_minor_needs_guardian_consent(client):
    _register_student(client)
    token = _auth(client)
    pid = _create_profile(client, token, date_of_birth="2015-01-01", guardian_consent=False).get_json()["profile"]["id"]
    res = client.post(f"/api/profiles/{pid}/submit", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 400
    assert "guardian" in res.get_json()["error"].lower()


def test_cannot_edit_submitted_profile(client):
    """A profile under review is frozen — 409 because it is a state conflict."""
    _register_student(client)
    token = _auth(client)
    pid = _create_profile(client, token, date_of_birth="2005-01-01", guardian_consent=True).get_json()["profile"]["id"]
    client.post(f"/api/profiles/{pid}/submit", headers={"Authorization": f"Bearer {token}"})
    res = client.put(f"/api/profiles/{pid}", json={"bio": "hack"}, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 409


def test_rejected_profile_can_be_fixed_and_resubmitted(client, app):
    """A rejection must be recoverable, otherwise the student is at a dead end."""
    _register_student(client)
    token = _auth(client)
    pid = _create_profile(client, token, date_of_birth="2005-01-01", guardian_consent=True).get_json()["profile"]["id"]
    client.post(f"/api/profiles/{pid}/submit", headers={"Authorization": f"Bearer {token}"})

    admin_token = _register_admin(client, app)
    client.post(f"/api/admin/profiles/{pid}/reject", json={"note": "Transcript unreadable."},
                headers={"Authorization": f"Bearer {admin_token}"})

    edit = client.put(f"/api/profiles/{pid}", json={"bio": "Corrected details."},
                      headers={"Authorization": f"Bearer {token}"})
    assert edit.status_code == 200

    resubmit = client.post(f"/api/profiles/{pid}/submit", headers={"Authorization": f"Bearer {token}"})
    assert resubmit.status_code == 200
    assert resubmit.get_json()["profile"]["status"] == "pending"


def test_approved_profile_is_locked_until_change_requested(client, app):
    """BR4: approved profiles are immutable; a reason reopens a review cycle."""
    _register_student(client)
    token = _auth(client)
    pid = _create_profile(client, token, date_of_birth="2005-01-01", guardian_consent=True).get_json()["profile"]["id"]
    client.post(f"/api/profiles/{pid}/submit", headers={"Authorization": f"Bearer {token}"})

    admin_token = _register_admin(client, app)
    client.post(f"/api/admin/profiles/{pid}/approve", json={"note": "All documents verified."},
                headers={"Authorization": f"Bearer {admin_token}"})

    blocked = client.put(f"/api/profiles/{pid}", json={"bio": "sneaky change"},
                         headers={"Authorization": f"Bearer {token}"})
    assert blocked.status_code == 409
    assert blocked.get_json()["code"] == "edit_request_required"

    # A reason is mandatory.
    assert client.post(f"/api/profiles/{pid}/request-edit", json={"reason": "typo"},
                       headers={"Authorization": f"Bearer {token}"}).status_code == 400

    reopened = client.post(f"/api/profiles/{pid}/request-edit",
                           json={"reason": "My school changed, I need to update the institution."},
                           headers={"Authorization": f"Bearer {token}"})
    assert reopened.status_code == 200
    assert reopened.get_json()["profile"]["status"] == "pending"


def test_ambassador_can_submit_the_profile_they_enrolled(client, app):
    """FR4 + BR5: enrolling a student is useless if the ambassador cannot submit them."""
    from app.models import User, Role
    from app.extensions import db

    with app.app_context():
        amb = User(email="amb@test.com", full_name="Amb Assador", role=Role.AMBASSADOR.value)
        amb.set_password("Passw0rd!")
        db.session.add(amb)
        db.session.commit()

    amb_token = client.post("/api/auth/login", json={"email": "amb@test.com", "password": "Passw0rd!"}).get_json()["access"]

    created = client.post("/api/profiles/", json={
        "bio": "Enrolled from Nyamata.",
        "academic_level": "S5",
        "funding_goal": 400000,
        "date_of_birth": "2004-03-02",
        "on_behalf_of_email": "rural@test.com",
        "on_behalf_of_name": "Rural Student",
    }, headers={"Authorization": f"Bearer {amb_token}"})
    assert created.status_code == 201
    pid = created.get_json()["profile"]["id"]

    edited = client.put(f"/api/profiles/{pid}", json={"bio": "Updated by ambassador."},
                        headers={"Authorization": f"Bearer {amb_token}"})
    assert edited.status_code == 200

    submitted = client.post(f"/api/profiles/{pid}/submit", headers={"Authorization": f"Bearer {amb_token}"})
    assert submitted.status_code == 200
    assert submitted.get_json()["profile"]["status"] == "pending"


def test_ambassador_cannot_touch_other_ambassadors_profiles(client, app):
    """BR5 ownership still holds after widening ambassador permissions."""
    from app.models import User, Role
    from app.extensions import db

    with app.app_context():
        for email in ("amb1@test.com", "amb2@test.com"):
            u = User(email=email, full_name="Amb", role=Role.AMBASSADOR.value)
            u.set_password("Passw0rd!")
            db.session.add(u)
        db.session.commit()

    t1 = client.post("/api/auth/login", json={"email": "amb1@test.com", "password": "Passw0rd!"}).get_json()["access"]
    t2 = client.post("/api/auth/login", json={"email": "amb2@test.com", "password": "Passw0rd!"}).get_json()["access"]

    pid = client.post("/api/profiles/", json={
        "bio": "Mine.", "academic_level": "S4", "funding_goal": 100000,
        "on_behalf_of_email": "kid@test.com", "on_behalf_of_name": "Kid",
    }, headers={"Authorization": f"Bearer {t1}"}).get_json()["profile"]["id"]

    res = client.put(f"/api/profiles/{pid}", json={"bio": "not mine"},
                     headers={"Authorization": f"Bearer {t2}"})
    assert res.status_code == 403


def test_minor_cannot_be_approved_without_verified_consent(client, app):
    """BR3 at the moment of publication, not merely at submission."""
    from app.models import StudentProfile, ProfileStatus, Document, DocType
    from app.extensions import db

    _register_student(client)
    token = _auth(client)
    pid = _create_profile(
        client, token,
        date_of_birth="2012-01-01",
        guardian_consent=True,
        guardian_name="Mama Uwase",
        guardian_phone="+250788000000",
    ).get_json()["profile"]["id"]

    # Force it into review without a consent document on file.
    with app.app_context():
        p = db.session.get(StudentProfile, pid)
        p.status = ProfileStatus.PENDING.value
        db.session.commit()

    admin_token = _register_admin(client, app)
    blocked = client.post(f"/api/admin/profiles/{pid}/approve", json={"note": "Looks fine to me."},
                          headers={"Authorization": f"Bearer {admin_token}"})
    assert blocked.status_code == 422
    assert blocked.get_json()["code"] == "guardian_consent_incomplete"

    # Upload the consent form, but leave it unverified — still blocked.
    with app.app_context():
        db.session.add(Document(
            profile_id=pid, doc_type=DocType.GUARDIAN_CONSENT.value,
            original_filename="consent.pdf", file_path="/tmp/consent.pdf",
        ))
        db.session.commit()

    still_blocked = client.post(f"/api/admin/profiles/{pid}/approve", json={"note": "Looks fine to me."},
                                headers={"Authorization": f"Bearer {admin_token}"})
    assert still_blocked.status_code == 422

    with app.app_context():
        doc = Document.query.filter_by(profile_id=pid).first()
        doc.verified = True
        db.session.commit()

    ok = client.post(f"/api/admin/profiles/{pid}/approve", json={"note": "Consent form checked against ID."},
                     headers={"Authorization": f"Bearer {admin_token}"})
    assert ok.status_code == 200


def test_document_is_served_only_to_authorised_viewers(client, app):
    """Admins must be able to open documents; unrelated users must not."""
    import os
    from app.models import StudentProfile, Document, DocType
    from app.extensions import db

    _register_student(client)
    token = _auth(client)
    pid = _create_profile(client, token).get_json()["profile"]["id"]

    upload_dir = app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_dir, exist_ok=True)
    path = os.path.join(upload_dir, "test-transcript.pdf")
    with open(path, "wb") as fh:
        fh.write(b"%PDF-1.4 test")

    with app.app_context():
        doc = Document(profile_id=pid, doc_type=DocType.TRANSCRIPT.value,
                       original_filename="transcript.pdf", file_path=path)
        db.session.add(doc)
        db.session.commit()
        did = doc.id

    owner = client.get(f"/api/profiles/{pid}/documents/{did}/file",
                       headers={"Authorization": f"Bearer {token}"})
    assert owner.status_code == 200
    owner.close()  # Windows keeps the handle open until the response is closed

    admin_token = _register_admin(client, app)
    admin = client.get(f"/api/profiles/{pid}/documents/{did}/file",
                       headers={"Authorization": f"Bearer {admin_token}"})
    assert admin.status_code == 200
    admin.close()

    client.post("/api/auth/register", json={
        "email": "nosy@test.com", "full_name": "Nosy Donor", "password": "Passw0rd!", "role": "donor"
    })
    nosy = client.post("/api/auth/login", json={"email": "nosy@test.com", "password": "Passw0rd!"}).get_json()["access"]
    assert client.get(f"/api/profiles/{pid}/documents/{did}/file",
                      headers={"Authorization": f"Bearer {nosy}"}).status_code == 403

    os.remove(path)


# ── Admin verification ───────────────────────────────────

def test_admin_approve(client, app):
    _register_student(client)
    token = _auth(client)
    pid = _create_profile(client, token, date_of_birth="2005-01-01", guardian_consent=True).get_json()["profile"]["id"]
    client.post(f"/api/profiles/{pid}/submit", headers={"Authorization": f"Bearer {token}"})

    admin_token = _register_admin(client, app)
    res = client.post(f"/api/admin/profiles/{pid}/approve", json={"note": "Documents verified."}, headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    assert res.get_json()["profile"]["status"] == "approved"


def test_admin_reject(client, app):
    _register_student(client)
    token = _auth(client)
    pid = _create_profile(client, token, date_of_birth="2005-01-01", guardian_consent=True).get_json()["profile"]["id"]
    client.post(f"/api/profiles/{pid}/submit", headers={"Authorization": f"Bearer {token}"})

    admin_token = _register_admin(client, app)
    res = client.post(f"/api/admin/profiles/{pid}/reject", json={"note": "Missing transcript."}, headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    assert res.get_json()["profile"]["status"] == "rejected"


def test_approve_needs_note(client, app):
    _register_student(client)
    token = _auth(client)
    pid = _create_profile(client, token, date_of_birth="2005-01-01", guardian_consent=True).get_json()["profile"]["id"]
    client.post(f"/api/profiles/{pid}/submit", headers={"Authorization": f"Bearer {token}"})

    admin_token = _register_admin(client, app)
    res = client.post(f"/api/admin/profiles/{pid}/approve", json={}, headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 400


def test_non_admin_cannot_approve(client):
    _register_student(client)
    token = _auth(client)
    pid = _create_profile(client, token, date_of_birth="2005-01-01", guardian_consent=True).get_json()["profile"]["id"]
    client.post(f"/api/profiles/{pid}/submit", headers={"Authorization": f"Bearer {token}"})
    res = client.post(f"/api/admin/profiles/{pid}/approve", json={"note": "hack"}, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403
