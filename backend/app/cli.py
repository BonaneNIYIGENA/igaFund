"""CLI commands."""
import os
from datetime import date, datetime, timezone
import click
from .extensions import db
from .models import User, Role


def register_cli(app):
    @app.cli.command("seed-admin")
    def seed_admin():
        """Create an admin from ADMIN_EMAIL / ADMIN_PASSWORD env vars."""
        email = os.environ.get("ADMIN_EMAIL", "admin@igafund.local")
        password = os.environ.get("ADMIN_PASSWORD", "Admin123!")
        if User.query.filter_by(email=email).first():
            click.echo("Admin already exists.")
            return
        user = User(email=email, full_name="Administrator", role=Role.ADMIN.value)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        click.echo(f"Created admin {email}")

    @app.cli.command("seed-demo")
    def seed_demo():
        """Seed realistic demo data for all four roles."""
        import os
        from .models import (
            StudentProfile, Institution, ProfileStatus, Contribution, Ticket,
            Document, DocType,
        )

        def get_or_create_user(email, full_name, role, password):
            user = User.query.filter_by(email=email).first()
            if user:
                return user
            user = User(email=email, full_name=full_name, role=role)
            user.set_password(password)
            db.session.add(user)
            db.session.commit()
            return user

        def get_or_create_institution(name, location, type_, bank_reference):
            inst = Institution.query.filter_by(name=name).first()
            if inst:
                return inst
            inst = Institution(name=name, location=location, type=type_, bank_reference=bank_reference)
            db.session.add(inst)
            db.session.commit()
            return inst

        def placeholder_document(profile, doc_type, filename, verified=False):
            """A real file on disk so the admin document viewer actually opens."""
            existing = Document.query.filter_by(profile_id=profile.id, doc_type=doc_type).first()
            if existing:
                return existing

            upload_dir = app.config["UPLOAD_FOLDER"]
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

        inst_uni = get_or_create_institution(
            "University of Rwanda (CST)", "Kigali", "university", "BK-UR-88392")
        inst_sec = get_or_create_institution(
            "GS Remera Secondary School", "Kigali", "secondary", "EQUITY-GSR-10293")
        get_or_create_institution("IPRC Kigali (TVET)", "Kigali", "tvet", "BK-IPRC-55201")
        get_or_create_institution(
            "Groupe Scolaire Nyamata", "Bugesera", "secondary", "BK-GSN-44120")

        get_or_create_user("admin@igafund.local", "Admin Supervisor", Role.ADMIN.value, "Admin123!")
        amb_user = get_or_create_user(
            "ambassador@igafund.local", "Grace Umutoni", Role.AMBASSADOR.value, "Ambassador123!")
        donor = get_or_create_user(
            "donor@igafund.local", "Jean-Luc Havugimana", Role.DONOR.value, "Donor123!")
        donor2 = get_or_create_user(
            "donor2@igafund.local", "Aline Mukamana", Role.DONOR.value, "Donor123!")

        s1 = get_or_create_user("keza@igafund.local", "Keza Aline", Role.STUDENT.value, "Student123!")
        s2 = get_or_create_user("mugisha@igafund.local", "Mugisha Claude", Role.STUDENT.value, "Student123!")

        p1 = StudentProfile.query.filter_by(user_id=s1.id).first()
        if not p1:
            p1 = StudentProfile(
                user_id=s1.id,
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
                funded_amount=420_000.0,
                status=ProfileStatus.APPROVED.value,
                submitted_at=datetime.now(timezone.utc),
                reviewed_at=datetime.now(timezone.utc),
                review_note="Transcript and national ID verified against university admission records.",
                guardian_consent=False,
                media_consent=True,
                photo_url=(
                    "https://images.unsplash.com/photo-1531123897727-8f129e1688ce"
                    "?w=400&h=400&fit=crop&crop=faces&q=70"
                ),
            )
            db.session.add(p1)
            db.session.commit()
            placeholder_document(p1, DocType.TRANSCRIPT.value, "keza-transcript.pdf", verified=True)
            placeholder_document(p1, DocType.ID_CARD.value, "keza-national-id.pdf", verified=True)
            placeholder_document(p1, DocType.RECOMMENDATION.value, "keza-lecturer-letter.pdf", verified=True)

        p2 = StudentProfile.query.filter_by(user_id=s2.id).first()
        if not p2:
            p2 = StudentProfile(
                user_id=s2.id,
                ambassador_id=amb_user.id,
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
                submitted_at=datetime.now(timezone.utc),
                guardian_name="Jean Mugisha",
                guardian_phone="+250788112233",
                guardian_consent=True,
            )
            db.session.add(p2)
            db.session.commit()
            # Left unverified on purpose: it demonstrates the BR3 approval gate.
            placeholder_document(p2, DocType.TRANSCRIPT.value, "mugisha-report.pdf")
            placeholder_document(p2, DocType.GUARDIAN_CONSENT.value, "mugisha-consent.pdf")

        if Contribution.query.count() == 0 and p1:
            db.session.add_all([
                Contribution(
                    donor_id=donor.id,
                    profile_id=p1.id,
                    institution_id=inst_uni.id,
                    amount=250_000.0,
                    message="Keep going — the health-post idea is a good one. My sister is a nurse in Rwamagana and she says the record-keeping is exactly as you describe.",
                    is_anonymous=False,
                    receipt_ref="REC-8839210A",
                    ticket_number="TICK-DON-20260721-9A3B",
                    routed_to_institution=True,
                ),
                Contribution(
                    donor_id=donor.id,
                    profile_id=p1.id,
                    institution_id=inst_uni.id,
                    amount=120_000.0,
                    message="Adding a little more towards next term. Good luck with the exams.",
                    is_anonymous=False,
                    receipt_ref="REC-9021447B",
                    ticket_number="TICK-DON-20260803-4C1D",
                    routed_to_institution=True,
                ),
                Contribution(
                    donor_id=donor2.id,
                    profile_id=p1.id,
                    institution_id=inst_uni.id,
                    amount=50_000.0,
                    message="From one Computer Science graduate to another.",
                    is_anonymous=True,
                    receipt_ref="REC-7710823C",
                    ticket_number="TICK-DON-20260810-77E2",
                    routed_to_institution=True,
                ),
            ])
            db.session.commit()

        from .blueprints.tickets.routes import create_process_ticket
        if Ticket.query.count() == 0:
            create_process_ticket(
                user_id=s1.id,
                process_type="profile_approved",
                title="Student profile verified and published",
                summary=(
                    f"Verification completed for {s1.full_name}. The profile is now listed "
                    "in the public donor pool."
                ),
                details={"institution": inst_uni.name, "academic_level": "Year 2"},
            )
            create_process_ticket(
                user_id=donor.id,
                process_type="contribution_funded",
                title="Direct institution payment processed",
                summary=f"250,000 RWF routed to {inst_uni.name} for {s1.full_name}.",
                details={
                    "receipt_ref": "REC-8839210A",
                    "amount": 250000,
                    "institution": inst_uni.name,
                    "bank_reference": inst_uni.bank_reference,
                },
            )
            create_process_ticket(
                user_id=donor.id,
                process_type="contribution_funded",
                title="Direct institution payment processed",
                summary=f"120,000 RWF routed to {inst_uni.name} for {s1.full_name}.",
                details={
                    "receipt_ref": "REC-9021447B",
                    "amount": 120000,
                    "institution": inst_uni.name,
                    "bank_reference": inst_uni.bank_reference,
                },
            )
            create_process_ticket(
                user_id=s1.id,
                process_type="funding_received",
                title="Educational funding payment received",
                summary=f"420,000 RWF received so far, routed directly to {inst_uni.name}.",
                details={"amount": 420000, "institution": inst_uni.name},
            )
            create_process_ticket(
                user_id=amb_user.id,
                process_type="ambassador_promoted",
                title="Promoted to community ambassador",
                summary=(
                    f"{amb_user.full_name} can now enroll students in their community."
                ),
                details={"community": "Kigali", "role": "ambassador"},
            )
            db.session.commit()

        click.echo("Successfully seeded demo data!")

