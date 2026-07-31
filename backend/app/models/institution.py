"""Institution — school or university that receives routed funds."""
from datetime import datetime, timezone
from ..extensions import db


class Institution(db.Model):
    __tablename__ = "institutions"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    location = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(50), nullable=False, default="secondary")  # secondary | university | tvet
    bank_reference = db.Column(db.String(100))  # simulated routing target
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    profiles = db.relationship("StudentProfile", back_populates="institution", lazy="dynamic")

    def to_dict(self, include_payment_details=False):
        """`include_payment_details` adds the routing account reference a donor
        pays into. Kept out of anonymous/public views — only a signed-in donor
        or admin sees it, right before they make a contribution."""
        d = {
            "id": self.id,
            "name": self.name,
            "location": self.location,
            "type": self.type,
        }
        if include_payment_details:
            d["bank_reference"] = self.bank_reference
        return d
