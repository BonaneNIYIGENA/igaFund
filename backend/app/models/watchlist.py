"""WatchedProfile — a donor following a student's funding progress."""
from datetime import datetime, timezone
from ..extensions import db


class WatchedProfile(db.Model):
    __tablename__ = "watched_profiles"
    __table_args__ = (db.UniqueConstraint("donor_id", "profile_id", name="uq_donor_profile_watch"),)

    id = db.Column(db.Integer, primary_key=True)
    donor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    profile_id = db.Column(db.Integer, db.ForeignKey("student_profiles.id"), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    donor = db.relationship("User")
    profile = db.relationship("StudentProfile")
