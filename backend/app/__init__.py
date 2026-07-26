"""App factory."""
import os
from flask import Flask
from .config import config_map
from .extensions import db, migrate, jwt, bcrypt, cors


def create_app(config_name=None):
    config_name = config_name or os.environ.get("FLASK_CONFIG", "dev")
    app = Flask(__name__)
    app.config.from_object(config_map[config_name])

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    from .blueprints.auth.routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    from .blueprints.profiles.routes import profiles_bp
    app.register_blueprint(profiles_bp, url_prefix="/api/profiles")

    from .blueprints.admin.routes import admin_bp
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    from .blueprints.notifications.routes import notifications_bp
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")

    from .blueprints.contributions.routes import contributions_bp
    app.register_blueprint(contributions_bp, url_prefix="/api/contributions")

    from .blueprints.tickets.routes import tickets_bp
    app.register_blueprint(tickets_bp, url_prefix="/api/tickets")

    from .blueprints.institutions.routes import institutions_bp
    app.register_blueprint(institutions_bp, url_prefix="/api/institutions")

    from .blueprints.audit.routes import audit_bp
    app.register_blueprint(audit_bp, url_prefix="/api/audit")

    from . import models  # noqa: F401  ensure models are registered for migrations

    from .cli import register_cli
    register_cli(app)

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    return app
