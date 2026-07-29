"""Comprehensive demo dataset for igaFund — used locally and in production.

Kept out of cli.py so that file stays a thin command registry. Every record
uses get-or-create semantics, so running `flask seed-demo` again against an
already-seeded database is safe: it only fills in whatever is still missing.
"""
import os
from datetime import date, datetime, timedelta, timezone
from flask import current_app

from .extensions import db
from .models import (
    User, Role, Institution, StudentProfile, ProfileStatus,
    Document, DocType, Contribution, Ticket, WatchedProfile,
)


def _get_or_create_user(email, full_name, role, password):
    user = User.query.filter_by(email=email).first()
    if user:
        return user
    user = User(email=email, full_name=full_name, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return user


def _get_or_create_institution(name, location, type_, bank_reference):
    inst = Institution.query.filter_by(name=name).first()
    if inst:
        return inst
    inst = Institution(name=name, location=location, type=type_, bank_reference=bank_reference)
    db.session.add(inst)
    db.session.commit()
    return inst


def _get_or_create_profile(user, **fields):
    """Returns (profile, created) — callers only attach documents on a fresh create."""
    profile = StudentProfile.query.filter_by(user_id=user.id).first()
    if profile:
        return profile, False
    profile = StudentProfile(user_id=user.id, **fields)
    db.session.add(profile)
    db.session.commit()
    return profile, True


def _placeholder_document(profile, doc_type, filename, verified=False):
    """A real file on disk so the admin document viewer actually opens it."""
    existing = Document.query.filter_by(profile_id=profile.id, doc_type=doc_type).first()
    if existing:
        return existing

    upload_dir = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_dir, exist_ok=True)
    path = os.path.join(upload_dir, f"demo-{profile.id}-{doc_type}.pdf")
    if not os.path.exists(path):
        label = f"igaFund demo document: {doc_type} for profile {profile.id}"
        # A minimal but genuinely valid single-page PDF.
        content = (
            "%PDF-1.4\n"
            "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
            "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
            "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 120]"
            "/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj\n"
            "4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n"
            f"5 0 obj<</Length {len(label) + 44}>>stream\n"
            f"BT /F1 10 Tf 20 60 Td ({label}) Tj ET\n"
            "endstream endobj\n"
            "trailer<</Root 1 0 R>>\n%%EOF\n"
        )
        with open(path, "w", encoding="latin-1") as fh:
            fh.write(content)

    doc = Document(
        profile_id=profile.id,
        doc_type=doc_type,
        original_filename=filename,
        file_path=path,
        verified=verified,
    )
    db.session.add(doc)
    db.session.commit()
    return doc


def _proof_url(label):
    """A stand-in payment-proof image via a real, stable placeholder-image
    service — not an actual receipt. Swap for real Cloudinary uploads once
    real donors start paying."""
    return f"https://placehold.co/600x800/e9f2ec/12312a?text={label.replace(' ', '+')}"


def _get_or_create_contribution(donor, profile, institution, *, amount, receipt_ref, **fields):
    """Idempotent on (donor, profile, receipt_ref). Bumps funded_amount only on first create."""
    existing = Contribution.query.filter_by(
        donor_id=donor.id, profile_id=profile.id, receipt_ref=receipt_ref,
    ).first()
    if existing:
        return existing, False
    c = Contribution(
        donor_id=donor.id, profile_id=profile.id, institution_id=institution.id,
        amount=amount, receipt_ref=receipt_ref, **fields,
    )
    db.session.add(c)
    profile.funded_amount = (profile.funded_amount or 0) + amount
    db.session.commit()
    return c, True


def _get_or_create_watch(donor, profile):
    existing = WatchedProfile.query.filter_by(donor_id=donor.id, profile_id=profile.id).first()
    if existing:
        return existing
    w = WatchedProfile(donor_id=donor.id, profile_id=profile.id)
    db.session.add(w)
    db.session.commit()
    return w


def run():
    """Seed the full demo dataset: 5 institutions, 1 admin, 2 ambassadors
    (one still being funded himself, one a fully-funded graduate), 5 student
    profiles spanning every status, and 5 donors with varied giving and
    following patterns. Idempotent — safe to run more than once."""
    from .blueprints.tickets.routes import create_process_ticket

    now = datetime.now(timezone.utc)

    # ---------------------------------------------------------------- institutions
    inst_uni = _get_or_create_institution("University of Rwanda (CST)", "Kigali", "university", "BK-UR-88392")
    inst_sec = _get_or_create_institution("GS Remera Secondary School", "Kigali", "secondary", "EQUITY-GSR-10293")
    inst_tvet = _get_or_create_institution("IPRC Kigali (TVET)", "Kigali", "tvet", "BK-IPRC-55201")
    inst_nyamata = _get_or_create_institution("Groupe Scolaire Nyamata", "Bugesera", "secondary", "BK-GSN-44120")
    inst_ines = _get_or_create_institution("INES-Ruhengeri", "Musanze", "university", "BK-INES-33012")

    # ---------------------------------------------------------------- admin
    _get_or_create_user("igafund.admin@gmail.com", "Admin Supervisor", Role.ADMIN.value, "Admin123!")

    # ---------------------------------------------------------------- ambassadors
    # Grace: a former beneficiary who finished her degree with igaFund's help
    # and now volunteers to enroll students in her community.
    grace = _get_or_create_user(
        "igafund.ambassador@gmail.com", "Grace Umutoni", Role.AMBASSADOR.value, "Ambassador123!")
    # Patrick: promoted to ambassador while STILL mid-way through being funded —
    # promotion doesn't require having finished, just a track record of good enrolments.
    patrick = _get_or_create_user(
        "patrick@igafund.local", "Patrick Habimana", Role.AMBASSADOR.value, "Ambassador123!")

    # ---------------------------------------------------------------- donors
    donor1 = _get_or_create_user("igafund.donor@gmail.com", "Jean-Luc Havugimana", Role.DONOR.value, "Donor123!")
    donor2 = _get_or_create_user("donor2@igafund.local", "Aline Mukamana", Role.DONOR.value, "Donor123!")
    donor3 = _get_or_create_user("donor3@igafund.local", "Samuel Uwimana", Role.DONOR.value, "Donor123!")
    donor4 = _get_or_create_user("donor4@igafund.local", "Chantal Mukamurenzi", Role.DONOR.value, "Donor123!")
    donor5 = _get_or_create_user("donor5@igafund.local", "Eric Habyarimana", Role.DONOR.value, "Donor123!")

    # ---------------------------------------------------------------- students
    keza = _get_or_create_user("igafund.student@gmail.com", "Keza Aline", Role.STUDENT.value, "Student123!")
    mugisha = _get_or_create_user("mugisha@igafund.local", "Mugisha Claude", Role.STUDENT.value, "Student123!")
    emmanuel = _get_or_create_user("emmanuel@igafund.local", "Emmanuel Niyonzima", Role.STUDENT.value, "Student123!")
    divine = _get_or_create_user("divine@igafund.local", "Divine Ingabire", Role.STUDENT.value, "Student123!")

    # 1. Keza — approved, partially funded, self-enrolled.
    p_keza, keza_new = _get_or_create_profile(
        keza,
        institution_id=inst_uni.id,
        date_of_birth=date(2004, 4, 12),
        phone="+250788445566",
        academic_level="Year 2",
        field_of_study="Computer Science",
        bio=(
            "I am in my second year of Computer Science at the University of Rwanda. "
            "I want to build software that helps rural health posts keep patient records "
            "without a reliable internet connection — I watched my own village clinic lose "
            "a year of records to a flood, and the nurses had to start again from memory.\n\n"
            "My family covered my first year by selling part of our land. My father had a "
            "stroke in January and can no longer work, so the remaining fees are beyond us. "
            "I tutor two secondary students on weekends, but it covers food, not tuition."
        ),
        funding_goal=850_000.0,
        funded_amount=0.0,
        status=ProfileStatus.APPROVED.value,
        submitted_at=now,
        reviewed_at=now,
        review_note="Transcript and national ID verified against university admission records.",
        guardian_consent=False,
        media_consent=True,
        photo_url=(
            "https://images.unsplash.com/photo-1531123897727-8f129e1688ce"
            "?w=400&h=400&fit=crop&crop=faces&q=70"
        ),
    )
    if keza_new:
        _placeholder_document(p_keza, DocType.TRANSCRIPT.value, "keza-transcript.pdf", verified=True)
        _placeholder_document(p_keza, DocType.ID_CARD.value, "keza-national-id.pdf", verified=True)
        _placeholder_document(p_keza, DocType.RECOMMENDATION.value, "keza-lecturer-letter.pdf", verified=True)

    # 2. Mugisha — pending, minor, enrolled by Grace.
    p_mugisha, mugisha_new = _get_or_create_profile(
        mugisha,
        ambassador_id=grace.id,
        institution_id=inst_sec.id,
        date_of_birth=date(2009, 9, 18),
        phone="+250788112200",
        academic_level="S6",
        field_of_study="Physics, Chemistry and Maths",
        bio=(
            "I am sitting my national exams this year and I want to study renewable "
            "energy engineering. Our home has no electricity, so I study at the school "
            "until the guard closes the gate. My mother sells vegetables at the market "
            "and cannot cover the examination and boarding fees."
        ),
        funding_goal=450_000.0,
        funded_amount=0.0,
        status=ProfileStatus.PENDING.value,
        submitted_at=now,
        guardian_name="Jean Mugisha",
        guardian_phone="+250788112233",
        guardian_consent=True,
    )
    if mugisha_new:
        # Left unverified on purpose: it demonstrates the BR3 approval gate.
        _placeholder_document(p_mugisha, DocType.TRANSCRIPT.value, "mugisha-report.pdf")
        _placeholder_document(p_mugisha, DocType.GUARDIAN_CONSENT.value, "mugisha-consent.pdf")

    # 3. Emmanuel — draft, never submitted, enrolled by Patrick.
    _get_or_create_profile(
        emmanuel,
        ambassador_id=patrick.id,
        institution_id=inst_tvet.id,
        date_of_birth=date(2003, 11, 30),
        phone="+250788998877",
        academic_level="Year 1",
        field_of_study="Electrical Installation",
        bio=(
            "Still writing my profile — I want to explain why solar installation "
            "training matters for my district before I submit this for review."
        ),
        funding_goal=300_000.0,
        funded_amount=0.0,
        status=ProfileStatus.DRAFT.value,
        guardian_consent=False,
    )
    # No documents on purpose — demonstrates the "upload documents first" state.

    # 4. Divine — rejected, real Rwandan A2-level nursing track, enrolled by Grace.
    p_divine, divine_new = _get_or_create_profile(
        divine,
        ambassador_id=grace.id,
        institution_id=inst_nyamata.id,
        date_of_birth=date(2005, 2, 3),
        phone="+250788556677",
        academic_level="A2",
        field_of_study="Nursing (A2)",
        bio=(
            "I want to become a nurse and return to work at the health center in my "
            "sector, which currently has one nurse for over four thousand people. I "
            "passed the entrance exam with a scholarship covering half my tuition and "
            "need help with the remainder plus accommodation."
        ),
        funding_goal=600_000.0,
        funded_amount=0.0,
        status=ProfileStatus.REJECTED.value,
        submitted_at=now,
        reviewed_at=now,
        review_note=(
            "The uploaded transcript is a photo of a photocopy and the marks are not "
            "legible. Please rescan or re-photograph the original document in good "
            "light and resubmit — everything else on the profile looks complete."
        ),
        guardian_consent=False,
    )
    if divine_new:
        _placeholder_document(p_divine, DocType.TRANSCRIPT.value, "divine-transcript.pdf")
        _placeholder_document(p_divine, DocType.ID_CARD.value, "divine-national-id.pdf", verified=True)

    # 5. Patrick's own profile — approved, still partly unfunded even though he's
    # now an ambassador himself. This is the "one of the 5 students" who doubles
    # as an ambassador: promotion doesn't require having finished paying for school.
    p_patrick, patrick_new = _get_or_create_profile(
        patrick,
        institution_id=inst_uni.id,
        date_of_birth=date(2002, 6, 20),
        phone="+250788334455",
        academic_level="Year 4",
        field_of_study="Business Information Technology",
        bio=(
            "I was verified as a student here two years ago, and igaFund later asked me "
            "to become an ambassador because of how carefully I documented my own "
            "application. I still have one year of tuition left to cover myself, so I'm "
            "both helping enroll students in my community and still finishing my own degree."
        ),
        funding_goal=700_000.0,
        funded_amount=0.0,
        status=ProfileStatus.APPROVED.value,
        submitted_at=now - timedelta(days=210),
        reviewed_at=now - timedelta(days=205),
        review_note="Verified. Promoted to ambassador after six months of accurate, well-documented enrolments on behalf of other students.",
        guardian_consent=False,
        media_consent=True,
    )
    if patrick_new:
        _placeholder_document(p_patrick, DocType.TRANSCRIPT.value, "patrick-transcript.pdf", verified=True)
        _placeholder_document(p_patrick, DocType.ID_CARD.value, "patrick-national-id.pdf", verified=True)

    # 6. Grace's own historical profile — fully funded and completed, from
    # before her promotion. Not one of the "5 students": a bonus record that
    # shows what a finished, closed-out funding goal looks like in the product.
    p_grace, grace_new = _get_or_create_profile(
        grace,
        institution_id=inst_ines.id,
        date_of_birth=date(2000, 3, 15),
        phone="+250788223344",
        academic_level="Graduated",
        field_of_study="Public Health",
        bio=(
            "I graduated in Public Health thanks to donors who covered my last two years "
            "of tuition after my father passed away. I'm an ambassador now so students in "
            "my home village get the same chance I did."
        ),
        funding_goal=900_000.0,
        funded_amount=0.0,
        status=ProfileStatus.APPROVED.value,
        submitted_at=now - timedelta(days=730),
        reviewed_at=now - timedelta(days=725),
        review_note="Verified and fully funded over two academic years — one of igaFund's first graduates.",
        guardian_consent=False,
        media_consent=True,
    )
    if grace_new:
        _placeholder_document(p_grace, DocType.TRANSCRIPT.value, "grace-transcript.pdf", verified=True)
        _placeholder_document(p_grace, DocType.ID_CARD.value, "grace-national-id.pdf", verified=True)

    # ---------------------------------------------------------------- contributions
    # Keza: two gifts from the same repeat donor, plus one anonymous gift.
    _get_or_create_contribution(
        donor1, p_keza, inst_uni,
        amount=250_000.0, receipt_ref="REC-8839210A", ticket_number="TICK-DON-20260721-9A3B",
        message="Keep going — the health-post idea is a good one. My sister is a nurse in Rwamagana and she says the record-keeping is exactly as you describe.",
        proof_image_url=_proof_url("MTN MoMo Receipt"), is_anonymous=False,
    )
    _get_or_create_contribution(
        donor1, p_keza, inst_uni,
        amount=120_000.0, receipt_ref="REC-9021447B", ticket_number="TICK-DON-20260803-4C1D",
        message="Adding a little more towards next term. Good luck with the exams.",
        proof_image_url=_proof_url("Bank of Kigali Slip"), is_anonymous=False,
    )
    _get_or_create_contribution(
        donor2, p_keza, inst_uni,
        amount=50_000.0, receipt_ref="REC-7710823C", ticket_number="TICK-DON-20260810-77E2",
        message="From one Computer Science graduate to another.",
        proof_image_url=_proof_url("Equity Bank Transfer"), is_anonymous=True,
    )
    _get_or_create_contribution(
        donor4, p_keza, inst_uni,
        amount=60_000.0, receipt_ref="REC-4402281E", ticket_number="TICK-DON-20260815-1B7C",
        message="Sent by bank transfer from Kigali — happy to help.",
        proof_image_url=_proof_url("Bank Transfer Slip"), is_anonymous=False,
    )

    # Patrick: three smaller gifts from three different donors — still ~30% funded.
    _get_or_create_contribution(
        donor3, p_patrick, inst_uni,
        amount=80_000.0, receipt_ref="REC-5510934D", ticket_number="TICK-DON-20260722-2C8D",
        message="MoMo sent — good luck finishing your own degree while helping others get theirs.",
        proof_image_url=_proof_url("MTN MoMo Receipt"), is_anonymous=False,
    )
    _get_or_create_contribution(
        donor4, p_patrick, inst_uni,
        amount=90_000.0, receipt_ref="REC-3391172F", ticket_number="TICK-DON-20260805-3D9E",
        message="Happy to help an ambassador who's still finishing his own studies too.",
        proof_image_url=_proof_url("Cash Deposit Slip"), is_anonymous=False,
    )
    _get_or_create_contribution(
        donor5, p_patrick, inst_uni,
        amount=40_000.0, receipt_ref="REC-2280063G", ticket_number="TICK-DON-20260812-4E1F",
        message="Sent via MoMo. Proud to support someone giving back while still finishing their own degree.",
        proof_image_url=_proof_url("MTN MoMo Receipt"), is_anonymous=False,
    )

    # Grace: two historical gifts, backdated, summing to exactly her funding
    # goal — this is what a "fully funded, completed" profile looks like.
    _get_or_create_contribution(
        donor1, p_grace, inst_ines,
        amount=600_000.0, receipt_ref="REC-1100221H", ticket_number="TICK-DON-20240811-5F2A",
        message="Covering your third year. Study well.",
        proof_image_url=_proof_url("Bank of Kigali Slip"), is_anonymous=False,
        created_at=now - timedelta(days=690),
    )
    _get_or_create_contribution(
        donor2, p_grace, inst_ines,
        amount=300_000.0, receipt_ref="REC-1100889I", ticket_number="TICK-DON-20250120-6A3B",
        message="Final term — congratulations on nearly finishing.",
        proof_image_url=_proof_url("Equity Bank Transfer"), is_anonymous=False,
        created_at=now - timedelta(days=560),
    )

    # ---------------------------------------------------------------- watchlist (follows)
    _get_or_create_watch(donor1, p_patrick)
    _get_or_create_watch(donor3, p_keza)
    _get_or_create_watch(donor3, p_patrick)
    _get_or_create_watch(donor3, p_grace)
    _get_or_create_watch(donor5, p_keza)

    # ---------------------------------------------------------------- tickets
    if Ticket.query.count() == 0:
        create_process_ticket(
            user_id=keza.id, process_type="profile_approved",
            title="Student profile verified and published",
            summary=f"Verification completed for {keza.full_name}. The profile is now listed in the public donor pool.",
            details={"institution": inst_uni.name, "academic_level": "Year 2"},
        )
        create_process_ticket(
            user_id=patrick.id, process_type="profile_approved",
            title="Student profile verified and published",
            summary=f"Verification completed for {patrick.full_name} prior to his ambassador promotion.",
            details={"institution": inst_uni.name, "academic_level": "Year 4"},
        )
        create_process_ticket(
            user_id=donor1.id, process_type="contribution_funded",
            title="Direct institution payment processed",
            summary=f"250,000 RWF routed to {inst_uni.name} for {keza.full_name}.",
            details={"receipt_ref": "REC-8839210A", "amount": 250000, "institution": inst_uni.name, "bank_reference": inst_uni.bank_reference},
        )
        create_process_ticket(
            user_id=donor1.id, process_type="contribution_funded",
            title="Direct institution payment processed",
            summary=f"120,000 RWF routed to {inst_uni.name} for {keza.full_name}.",
            details={"receipt_ref": "REC-9021447B", "amount": 120000, "institution": inst_uni.name, "bank_reference": inst_uni.bank_reference},
        )
        create_process_ticket(
            user_id=keza.id, process_type="funding_received",
            title="Educational funding payment received",
            summary=f"{keza.full_name} has received {p_keza.funded_amount:,.0f} RWF so far, routed directly to {inst_uni.name}.",
            details={"amount": p_keza.funded_amount, "institution": inst_uni.name},
        )
        create_process_ticket(
            user_id=patrick.id, process_type="funding_received",
            title="Educational funding payment received",
            summary=f"{patrick.full_name} has received {p_patrick.funded_amount:,.0f} RWF so far, routed directly to {inst_uni.name}.",
            details={"amount": p_patrick.funded_amount, "institution": inst_uni.name},
        )
        create_process_ticket(
            user_id=grace.id, process_type="funding_received",
            title="Educational funding payment received",
            summary=f"{grace.full_name}'s funding goal was fully reached — {p_grace.funded_amount:,.0f} RWF routed to {inst_ines.name} across two academic years.",
            details={"amount": p_grace.funded_amount, "institution": inst_ines.name},
        )
        create_process_ticket(
            user_id=grace.id, process_type="ambassador_promoted",
            title="Promoted to community ambassador",
            summary=f"{grace.full_name} can now enroll students in her community, after graduating with igaFund's support.",
            details={"community": "Musanze", "role": "ambassador"},
        )
        create_process_ticket(
            user_id=patrick.id, process_type="ambassador_promoted",
            title="Promoted to community ambassador",
            summary=f"{patrick.full_name} can now enroll students in his community, while still finishing his own degree.",
            details={"community": "Kigali", "role": "ambassador"},
        )

    return {
        "institutions": Institution.query.count(),
        "users": User.query.count(),
        "profiles": StudentProfile.query.count(),
        "contributions": Contribution.query.count(),
        "watching": WatchedProfile.query.count(),
    }
