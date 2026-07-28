"""Ticket — official timestamped record for every completed process/requirement."""
import json
from datetime import datetime, timezone
from ..extensions import db


class Ticket(db.Model):
    __tablename__ = "tickets"

    id = db.Column(db.Integer, primary_key=True)
    ticket_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    process_type = db.Column(db.String(50), nullable=False)  # profile_submitted | profile_approved | ambassador_promoted | contribution_funded
    title = db.Column(db.String(255), nullable=False)
    summary = db.Column(db.Text, nullable=False)
    details_json = db.Column(db.Text)  # JSON formatted extra details
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", backref=db.backref("tickets", lazy="dynamic"))

    def to_dict(self):
        details = {}
        if self.details_json:
            try:
                details = json.loads(self.details_json)
            except Exception:
                details = {}

        return {
            "id": self.id,
            "ticket_number": self.ticket_number,
            "user_id": self.user_id,
            "user_name": self.user.full_name if self.user else "User",
            "process_type": self.process_type,
            "title": self.title,
            "summary": self.summary,
            "details": details,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
