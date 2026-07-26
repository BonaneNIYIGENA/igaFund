"""Document — verification file attached to a student profile."""
from datetime import datetime, timezone
from enum import Enum
from ..extensions import db


class DocType(str, Enum):
    ID_CARD = "id_card"
    TRANSCRIPT = "transcript"
    RECOMMENDATION = "recommendation"
    GUARDIAN_CONSENT = "guardian_consent"


class Document(db.Model):
    __tablename__ = "documents"

    id = db.Column(db.Integer, primary_key=True)
    profile_id = db.Column(db.Integer, db.ForeignKey("student_profiles.id"), nullable=False, index=True)
    doc_type = db.Column(db.String(30), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    verified = db.Column(db.Boolean, default=False)
    uploaded_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    profile = db.relationship("StudentProfile", back_populates="documents")

    def to_dict(self):
        return {
            "id": self.id,
            "profile_id": self.profile_id,
            "doc_type": self.doc_type,
            "original_filename": self.original_filename,
            "verified": self.verified,
            "uploaded_at": self.uploaded_at.isoformat() if self.uploaded_at else None,
        }
