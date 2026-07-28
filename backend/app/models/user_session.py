"""UserSession — server-side session record backing revocation and idle timeout.

JWTs are normally stateless, but §5.4 requires a session that can actually be
terminated: 24h idle timeout, immediate revocation on sign-out, and a single
concurrent session for admin accounts. Each login/register issues one `sid`
shared by the access and refresh token pair; every check against this table
happens by that `sid`, not by user id, so revoking one session never touches
another device's session for the same user.
"""
from datetime import datetime, timezone
from ..extensions import db

IDLE_TIMEOUT_HOURS = 24


class UserSession(db.Model):
    __tablename__ = "user_sessions"

    id = db.Column(db.Integer, primary_key=True)
    sid = db.Column(db.String(36), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    last_used_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    revoked = db.Column(db.Boolean, nullable=False, default=False)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.String(255))

    user = db.relationship("User", backref="sessions")

    def is_idle_expired(self):
        last = self.last_used_at
        if last.tzinfo is None:
            last = last.replace(tzinfo=timezone.utc)
        return (datetime.now(timezone.utc) - last).total_seconds() > IDLE_TIMEOUT_HOURS * 3600

    def touch(self):
        self.last_used_at = datetime.now(timezone.utc)

    def to_dict(self):
        return {
            "sid": self.sid,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_used_at": self.last_used_at.isoformat() if self.last_used_at else None,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
        }
