"""AuditLog — append-only record of admin actions."""
from datetime import datetime, timezone
from ..extensions import db


class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id = db.Column(db.Integer, primary_key=True)
    actor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    action = db.Column(db.String(50), nullable=False)  # e.g. profile_approved, profile_rejected
    target_type = db.Column(db.String(50), nullable=False)  # e.g. student_profile
    target_id = db.Column(db.Integer, nullable=False)
    note = db.Column(db.Text, nullable=False)  # mandatory per BR7
    ip_address = db.Column(db.String(45), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    actor = db.relationship("User", backref="audit_actions")

    def to_dict(self):
        return {
            "id": self.id,
            "actor_id": self.actor_id,
            "action": self.action,
            "target_type": self.target_type,
            "target_id": self.target_id,
            "note": self.note,
            "ip_address": self.ip_address,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
