"""Notification — in-app alerts for users."""
from datetime import datetime, timezone
from ..extensions import db


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    type = db.Column(db.String(50), nullable=False, default="info")  # info | success | warning | action
    message = db.Column(db.Text, nullable=False)
    read = db.Column(db.Boolean, default=False)
    link = db.Column(db.String(255))  # optional frontend route to navigate to
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", backref="notifications")

    def to_dict(self):
        return {
            "id": self.id,
            "type": self.type,
            "message": self.message,
            "read": self.read,
            "link": self.link,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
