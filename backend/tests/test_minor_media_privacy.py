"""NFR3: a minor's photo/video is never public — only a signed-in donor or
admin may see it, and only once a guardian has consented."""


def _register_student(client, email="minor@test.com"):
    return client.post("/api/auth/register", json={
        "email": email, "full_name": "Minor Student", "password": "Passw0rd!", "role": "student"
    })


def _register_donor(client, email="donor@test.com"):
    client.post("/api/auth/register", json={
        "email": email, "full_name": "A Donor", "password": "Passw0rd!", "role": "donor"
    })
    login = client.post("/api/auth/login", json={"email": email, "password": "Passw0rd!"})
    return login.get_json()["access"]


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


def _auth(client, email="minor@test.com"):
    login = client.post("/api/auth/login", json={"email": email, "password": "Passw0rd!"})
    return login.get_json()["access"]


def _approved_minor_profile(client, app, token):
    """Build and approve a minor profile with guardian consent — mirrors
    test_profiles.py::test_minor_cannot_be_approved_without_verified_consent."""
    from app.models import StudentProfile, ProfileStatus, Document, DocType
    from app.extensions import db

    mine = client.get("/api/profiles/", headers={"Authorization": f"Bearer {token}"})
    pid = mine.get_json()["profiles"][0]["id"]
    client.put(f"/api/profiles/{pid}", json={
        "bio": "I love learning.", "academic_level": "S4", "funding_goal": 500000,
        "date_of_birth": "2012-01-01", "guardian_consent": True,
        "guardian_name": "Mama Uwase", "guardian_phone": "+250788000000",
    }, headers={"Authorization": f"Bearer {token}"})

    with app.app_context():
        p = db.session.get(StudentProfile, pid)
        p.status = ProfileStatus.PENDING.value
        db.session.add(Document(
            profile_id=pid, doc_type=DocType.GUARDIAN_CONSENT.value,
            original_filename="consent.pdf", file_path="/tmp/consent.pdf", verified=True,
        ))
        db.session.commit()

    admin_token = _register_admin(client, app)
    approve = client.post(f"/api/admin/profiles/{pid}/approve", json={"note": "Consent form checked."},
                           headers={"Authorization": f"Bearer {admin_token}"})
    assert approve.status_code == 200
    return pid


def test_minor_photo_hidden_from_anonymous_visitor(client, app):
    _register_student(client)
    token = _auth(client)
    pid = _approved_minor_profile(client, app, token)

    from app.models import StudentProfile
    from app.extensions import db
    with app.app_context():
        p = db.session.get(StudentProfile, pid)
        p.photo_url = "https://example.com/photo.jpg"
        p.media_consent = True
        db.session.commit()

    res = client.get("/api/profiles/public")
    assert res.status_code == 200
    profile = next(p for p in res.get_json()["profiles"] if p["id"] == pid)
    assert "photo_url" not in profile


def test_minor_photo_visible_to_signed_in_donor(client, app):
    _register_student(client)
    token = _auth(client)
    pid = _approved_minor_profile(client, app, token)

    from app.models import StudentProfile
    from app.extensions import db
    with app.app_context():
        p = db.session.get(StudentProfile, pid)
        p.photo_url = "https://example.com/photo.jpg"
        p.media_consent = True
        db.session.commit()

    donor_token = _register_donor(client)
    res = client.get("/api/profiles/public", headers={"Authorization": f"Bearer {donor_token}"})
    assert res.status_code == 200
    profile = next(p for p in res.get_json()["profiles"] if p["id"] == pid)
    assert profile["photo_url"] == "https://example.com/photo.jpg"


def test_minor_full_name_still_masked_for_donor(client, app):
    """Visibility only relaxes for the photo/video — never the legal name."""
    _register_student(client)
    token = _auth(client)
    pid = _approved_minor_profile(client, app, token)

    donor_token = _register_donor(client)
    res = client.get("/api/profiles/public", headers={"Authorization": f"Bearer {donor_token}"})
    profile = next(p for p in res.get_json()["profiles"] if p["id"] == pid)
    assert profile["full_name"] == "Verified Student"


def test_upload_photo_blocked_for_minor_without_guardian_consent(client):
    _register_student(client)
    token = _auth(client)
    mine = client.get("/api/profiles/", headers={"Authorization": f"Bearer {token}"})
    pid = mine.get_json()["profiles"][0]["id"]
    client.put(f"/api/profiles/{pid}", json={"date_of_birth": "2012-01-01", "guardian_consent": False},
               headers={"Authorization": f"Bearer {token}"})

    res = client.post(
        f"/api/profiles/{pid}/photo",
        data={"file": (__import__("io").BytesIO(b"\x89PNG\r\n\x1a\nfake"), "photo.png")},
        headers={"Authorization": f"Bearer {token}"},
        content_type="multipart/form-data",
    )
    assert res.status_code == 403


def test_photo_url_stripped_from_general_update_for_unconsented_minor(client):
    """Safety net: PUT /profiles/<id> can't be used to bypass the guardian-consent gate."""
    _register_student(client)
    token = _auth(client)
    mine = client.get("/api/profiles/", headers={"Authorization": f"Bearer {token}"})
    pid = mine.get_json()["profiles"][0]["id"]

    res = client.put(f"/api/profiles/{pid}", json={
        "date_of_birth": "2012-01-01",
        "guardian_consent": False,
        "photo_url": "https://example.com/sneaky.jpg",
        "media_consent": True,
    }, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.get_json()["profile"].get("photo_url") is None
