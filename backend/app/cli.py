"""CLI commands."""
import os
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
        """Seed realistic demo data for all four roles (see app/seed_data.py)."""
        from .seed_data import run
        counts = run()
        click.echo(
            "Successfully seeded demo data! "
            f"{counts['institutions']} institutions, {counts['users']} users, "
            f"{counts['profiles']} profiles, {counts['contributions']} contributions, "
            f"{counts['watching']} follows."
        )

