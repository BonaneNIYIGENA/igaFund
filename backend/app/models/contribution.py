"""Contribution — donor funding routed to institution (BR2: never personal)."""
from datetime import datetime, timezone
from ..extensions import db


class Contribution(db.Model):
    __tablename__ = "contributions"

    id = db.Column(db.Integer, primary_key=True)
    donor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    profile_id = db.Column(db.Integer, db.ForeignKey("student_profiles.id"), nullable=False, index=True)
    institution_id = db.Column(db.Integer, db.ForeignKey("institutions.id"), nullable=False)

    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(5), default="RWF")
    receipt_ref = db.Column(db.String(100))  # simulated receipt number
    # Payment evidence is mandatory (FR4.3); the link points at cloud storage.
    proof_image_url = db.Column(db.String(500))
    proof_public_id = db.Column(db.String(255))
    ticket_number = db.Column(db.String(50))  # official transaction ticket number
    message = db.Column(db.Text)  # encouraging message from donor
    is_anonymous = db.Column(db.Boolean, default=False)  # hide donor name flag
    routed_to_institution = db.Column(db.Boolean, default=True)  # always true per BR2
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    donor = db.relationship("User", backref="contributions")
    profile = db.relationship("StudentProfile", backref="contributions")
    institution = db.relationship("Institution")

    def to_dict(self):
        donor_name = "Anonymous Donor" if self.is_anonymous else (self.donor.full_name if self.donor else "Donor")
        return {
            "id": self.id,
            "donor_id": self.donor_id if not self.is_anonymous else None,
            "donor_name": donor_name,
            "profile_id": self.profile_id,
            "student_name": self.profile.full_name if (self.profile and hasattr(self.profile, "full_name")) else (self.profile.user.full_name if (self.profile and self.profile.user) else "Student"),
            "amount": self.amount,
            "currency": self.currency,
            "receipt_ref": self.receipt_ref,
            "proof_image_url": self.proof_image_url,
            "ticket_number": self.ticket_number,
            "message": self.message,
            "is_anonymous": self.is_anonymous,
            "routed_to_institution": self.routed_to_institution,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "institution": self.institution.to_dict() if self.institution else None,
        }
