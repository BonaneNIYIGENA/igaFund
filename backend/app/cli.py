"""CLI commands."""
import os
from datetime import date
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
        """Seed complete realistic demo data for all 4 roles and institutions."""
        from .models import StudentProfile, Institution, ProfileStatus, Contribution, Ticket

        # Seed institutions
        inst1 = Institution.query.filter_by(name="University of Rwanda (CST)").first()
        if not inst1:
            inst1 = Institution(name="University of Rwanda (CST)", location="Kigali", type="university", bank_reference="BK-UR-88392")
            inst2 = Institution(name="GS Remera Secondary School", location="Kigali", type="secondary", bank_reference="EQUITY-GSR-10293")
            inst3 = Institution(name="IPRC Kigali (TVET)", location="Kigali", type="tvet", bank_reference="BK-IPRC-55201")
            db.session.add_all([inst1, inst2, inst3])
            db.session.commit()

        # Admin
        admin_email = "admin@igafund.local"
        if not User.query.filter_by(email=admin_email).first():
            u_admin = User(email=admin_email, full_name="Admin Supervisor", role=Role.ADMIN.value)
            u_admin.set_password("Admin123!")
            db.session.add(u_admin)

        # Ambassador
        amb_email = "ambassador@igafund.local"
        amb_user = User.query.filter_by(email=amb_email).first()
        if not amb_user:
            amb_user = User(email=amb_email, full_name="Grace Umutoni (Ambassador)", role=Role.AMBASSADOR.value)
            amb_user.set_password("Ambassador123!")
            db.session.add(amb_user)
            db.session.commit()

        # Approved Student (Ready for Donors)
        s1_email = "keza@igafund.local"
        s1_user = User.query.filter_by(email=s1_email).first()
        if not s1_user:
            s1_user = User(email=s1_email, full_name="Keza Aline", role=Role.STUDENT.value)
            s1_user.set_password("Student123!")
            db.session.add(s1_user)
            db.session.commit()

            sp1 = StudentProfile(
                user_id=s1_user.id,
                institution_id=inst1.id,
                date_of_birth=date(2005, 4, 12),
                academic_level="Undergraduate",
                field_of_study="Computer Science",
                bio="Aspiring software engineer passionate about building technology solutions for rural healthcare in Rwanda.",
                funding_goal=800.0,
                funded_amount=350.0,
                status=ProfileStatus.APPROVED.value,
                guardian_consent=True
            )
            db.session.add(sp1)

        # Pending Student (Ready for Admin Approval demo)
        s2_email = "mugisha@igafund.local"
        s2_user = User.query.filter_by(email=s2_email).first()
        if not s2_user:
            s2_user = User(email=s2_email, full_name="Mugisha Claude", role=Role.STUDENT.value)
            s2_user.set_password("Student123!")
            db.session.add(s2_user)
            db.session.commit()

            sp2 = StudentProfile(
                user_id=s2_user.id,
                ambassador_id=amb_user.id,
                institution_id=inst1.id,
                date_of_birth=date(2007, 9, 18),
                academic_level="Secondary S6",
                field_of_study="Physics, Chemistry, Math (PCM)",
                bio="Final year high school student striving to complete national exams and pursue renewable energy engineering.",
                funding_goal=450.0,
                funded_amount=0.0,
                status=ProfileStatus.PENDING.value,
                guardian_name="Jean Mugisha",
                guardian_phone="+250788112233",
                guardian_consent=True
            )
            db.session.add(sp2)


        # Donor
        donor_email = "donor@igafund.local"
        u_donor = User.query.filter_by(email=donor_email).first()
        if not u_donor:
            u_donor = User(email=donor_email, full_name="Jean-Luc Havugimana", role=Role.DONOR.value)
            u_donor.set_password("Donor123!")
            db.session.add(u_donor)
            db.session.commit()

        # Seed sample contribution with proof image and tickets if none exist
        if Contribution.query.count() == 0 and s1_user and s1_user.profile:
            contrib = Contribution(
                donor_id=u_donor.id,
                profile_id=s1_user.profile.id,
                institution_id=inst1.id,
                amount=350.0,
                message="Keep up the outstanding work in Computer Science!",
                is_anonymous=False,
                proof_image_url="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60",
                receipt_ref="REC-8839210A",
                ticket_number="TICK-DON-20260721-9A3B",
                routed_to_institution=True
            )
            db.session.add(contrib)
            db.session.commit()

        # Seed initial tickets
        from .blueprints.tickets.routes import create_process_ticket
        if Ticket.query.count() == 0:
            if s1_user:
                create_process_ticket(
                    user_id=s1_user.id,
                    process_type="profile_approved",
                    title="Student Profile Verified & Published",
                    summary=f"Official verification completed for {s1_user.full_name}. Profile published on public donor portal.",
                    details={"institution": inst1.name, "academic_level": "Undergraduate", "funding_goal": "800 USD"}
                )
            if amb_user:
                create_process_ticket(
                    user_id=amb_user.id,
                    process_type="ambassador_promoted",
                    title="Promoted to Community Ambassador",
                    summary=f"Official promotion ticket for {amb_user.full_name} to assist in onboarding student candidates in rural communities.",
                    details={"community": "Kigali", "role": "ambassador"}
                )

        db.session.commit()
        click.echo("Successfully seeded demo data!")

