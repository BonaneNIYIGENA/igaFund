"""User model and roles."""
from datetime import datetime, timezone
from enum import Enum
from ..extensions import db, bcrypt


class Role(str, Enum):
    STUDENT = "student"
    AMBASSADOR = "ambassador"
    DONOR = "donor"
    ADMIN = "admin"


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default=Role.DONOR.value)
    full_name = db.Column(db.String(255), nullable=False)
    is_suspended = db.Column(db.Boolean, nullable=False, default=False)
    notify_email = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def set_password(self, raw):
        self.password_hash = bcrypt.generate_password_hash(raw).decode()

    def check_password(self, raw):
        return bcrypt.check_password_hash(self.password_hash, raw)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "role": self.role,
            "full_name": self.full_name,
            "is_suspended": self.is_suspended,
            "notify_email": self.notify_email,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
