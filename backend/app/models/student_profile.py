"""StudentProfile — a student's verified funding profile."""
from datetime import datetime, timezone, date
from enum import Enum
from ..extensions import db


class ProfileStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class StudentProfile(db.Model):
    __tablename__ = "student_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    ambassador_id = db.Column(db.Integer, db.ForeignKey("users.id"), index=True)  # null if self-enrolled

    # personal
    bio = db.Column(db.Text, default="")
    date_of_birth = db.Column(db.Date)
    phone = db.Column(db.String(30))

    # academic
    institution_id = db.Column(db.Integer, db.ForeignKey("institutions.id"), index=True)
    academic_level = db.Column(db.String(50))  # S1-S6, Year1-4, etc.
    field_of_study = db.Column(db.String(120))

    # funding
    funding_goal = db.Column(db.Float, default=0)
    funded_amount = db.Column(db.Float, default=0)

    # guardian (required for minors, BR3)
    guardian_name = db.Column(db.String(255))
    guardian_phone = db.Column(db.String(30))
    guardian_consent = db.Column(db.Boolean, default=False)

    # adult visual media (18+ only, with consent)
    video_url = db.Column(db.String(500))
    photo_url = db.Column(db.String(500))
    media_consent = db.Column(db.Boolean, default=False)

    # workflow
    status = db.Column(db.String(20), nullable=False, default=ProfileStatus.DRAFT.value)
    submitted_at = db.Column(db.DateTime)
    reviewed_at = db.Column(db.DateTime)
    review_note = db.Column(db.Text)
    # BR4: why an already-approved profile was reopened for a new review cycle
    edit_request_reason = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # relationships
    user = db.relationship("User", foreign_keys=[user_id], backref=db.backref("profile", uselist=False))
    ambassador = db.relationship("User", foreign_keys=[ambassador_id])
    institution = db.relationship("Institution", back_populates="profiles")
    documents = db.relationship("Document", back_populates="profile", lazy="dynamic", cascade="all, delete-orphan")

    def is_minor(self):
        if not self.date_of_birth:
            return True  # default to requiring consent & restricting visual media
        today = date.today()
        age = today.year - self.date_of_birth.year - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))
        return age < 18

    def to_dict(self, public=False, viewer_may_see_minor_media=False, viewer_may_see_payment_details=False):
        """`viewer_may_see_minor_media` only relaxes photo/video visibility for a
        minor — never their name, which stays masked for every viewer regardless
        of role. It's set by the caller for an authenticated donor or admin, and
        left False for anonymous/public requests (NFR3).

        `viewer_may_see_payment_details` adds the institution's routing account
        reference — shown to a signed-in donor right before they contribute,
        never to an anonymous visitor."""
        d = {
            "id": self.id,
            "status": self.status,
            "bio": self.bio,
            "academic_level": self.academic_level,
            "field_of_study": self.field_of_study,
            "funding_goal": self.funding_goal,
            "funded_amount": self.funded_amount,
            "institution": self.institution.to_dict(include_payment_details=viewer_may_see_payment_details) if self.institution else None,
            "document_count": self.documents.count(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "is_minor": self.is_minor(),
            "full_name": self.user.full_name if (self.user and not self.is_minor()) else "Verified Student",
        }
        # NFR3: a minor's likeness is never public. It can only be shown to a
        # signed-in donor or admin, and only once a guardian has consented —
        # never to an anonymous visitor, whatever the consent flag says.
        may_show_media = not self.is_minor() or (viewer_may_see_minor_media and self.guardian_consent)
        if may_show_media and self.media_consent:
            if self.video_url:
                d["video_url"] = self.video_url
            if self.photo_url:
                d["photo_url"] = self.photo_url

        if not public:
            d.update({
                "user_id": self.user_id,
                "date_of_birth": self.date_of_birth.isoformat() if self.date_of_birth else None,
                "phone": self.phone,
                "guardian_name": self.guardian_name,
                "guardian_phone": self.guardian_phone,
                "guardian_consent": self.guardian_consent,
                "video_url": self.video_url,
                "photo_url": self.photo_url,
                "media_consent": self.media_consent,
                "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None,
                "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None,
                "review_note": self.review_note,
                "edit_request_reason": self.edit_request_reason,
                "ambassador_id": self.ambassador_id,
                "email": self.user.email if self.user else None,
                "full_name": self.user.full_name if self.user else None,
                # BR3 readiness, so reviewers see consent state without a second call
                "has_guardian_consent_document": bool(
                    self.documents.filter_by(doc_type="guardian_consent").first()
                ),
            })
        return d
