"""Admin verification + management endpoints."""
from datetime import datetime, timezone
import io
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import Schema, fields, validate, ValidationError

from ...extensions import db
from ...models import (
    User, Role, StudentProfile, ProfileStatus,
    AuditLog, Notification, Document,
)
from ...common.decorators import role_required

from ..tickets.routes import create_process_ticket

admin_bp = Blueprint("admin", __name__)


class ReviewSchema(Schema):
    note = fields.Str(required=True, validate=validate.Length(min=5))


# ── Verification queue ────────────────────────────────────

@admin_bp.get("/profiles")
@role_required(Role.ADMIN.value)
def list_profiles():
    status = request.args.get("status", "pending")
    q = StudentProfile.query
    if status != "all":
        q = q.filter_by(status=status)
    profiles = q.order_by(StudentProfile.submitted_at.desc()).all()
    return jsonify({"profiles": [p.to_dict() for p in profiles]}), 200


@admin_bp.get("/profiles/<int:profile_id>")
@role_required(Role.ADMIN.value)
def get_profile(profile_id):
    profile = db.session.get(StudentProfile, profile_id)
    if not profile:
        return jsonify({"error": "Not found."}), 404
    docs = Document.query.filter_by(profile_id=profile.id).all()
    return jsonify({
        "profile": profile.to_dict(),
        "documents": [d.to_dict() for d in docs],
    }), 200


@admin_bp.post("/profiles/<int:profile_id>/approve")
@role_required(Role.ADMIN.value)
def approve_profile(profile_id):
    profile = db.session.get(StudentProfile, profile_id)
    if not profile:
        return jsonify({"error": "Not found."}), 404
    if profile.status != ProfileStatus.PENDING.value:
        return jsonify({"error": "Only pending profiles can be approved."}), 400

    try:
        data = ReviewSchema().load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    admin_id = int(get_jwt_identity())

    profile.status = ProfileStatus.APPROVED.value
    profile.reviewed_at = datetime.now(timezone.utc)
    profile.review_note = data["note"]

    db.session.add(AuditLog(
        actor_id=admin_id,
        action="profile_approved",
        target_type="student_profile",
        target_id=profile.id,
        note=data["note"],
    ))
    db.session.add(Notification(
        user_id=profile.user_id,
        type="success",
        message="Your profile has been approved! Donors can now find and fund your education.",
        link="/student/profile",
    ))

    # Issue official Process Ticket
    create_process_ticket(
        user_id=profile.user_id,
        process_type="profile_approved",
        title="Student Profile Verified & Approved",
        summary=f"Official verification completed for {profile.user.full_name if profile.user else 'Student'}. Profile is now publicly listed for institutional funding.",
        details={
            "profile_id": profile.id,
            "institution": profile.institution.name if profile.institution else "Partner Institution",
            "academic_level": profile.academic_level,
            "review_note": data["note"]
        }
    )

    db.session.commit()

    return jsonify({"profile": profile.to_dict()}), 200


@admin_bp.post("/profiles/<int:profile_id>/reject")
@role_required(Role.ADMIN.value)
def reject_profile(profile_id):
    profile = db.session.get(StudentProfile, profile_id)
    if not profile:
        return jsonify({"error": "Not found."}), 404
    if profile.status != ProfileStatus.PENDING.value:
        return jsonify({"error": "Only pending profiles can be rejected."}), 400

    try:
        data = ReviewSchema().load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    admin_id = int(get_jwt_identity())

    profile.status = ProfileStatus.REJECTED.value
    profile.reviewed_at = datetime.now(timezone.utc)
    profile.review_note = data["note"]

    db.session.add(AuditLog(
        actor_id=admin_id,
        action="profile_rejected",
        target_type="student_profile",
        target_id=profile.id,
        note=data["note"],
    ))
    db.session.add(Notification(
        user_id=profile.user_id,
        type="warning",
        message=f"Your profile was not approved. Reason: {data['note']}",
        link="/student/profile",
    ))
    db.session.commit()

    return jsonify({"profile": profile.to_dict()}), 200


@admin_bp.post("/users/<int:user_id>/promote-ambassador")
@role_required(Role.ADMIN.value)
def promote_ambassador(user_id):
    """Promote a verified student to Community Ambassador role."""
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404

    user.role = Role.AMBASSADOR.value
    db.session.add(AuditLog(
        actor_id=int(get_jwt_identity()),
        action="promoted_ambassador",
        target_type="user",
        target_id=user.id,
        note=f"Promoted student {user.full_name} to Community Ambassador",
    ))
    
    ticket = create_process_ticket(
        user_id=user.id,
        process_type="ambassador_promoted",
        title="Promoted to Community Ambassador",
        summary=f"Congratulations {user.full_name}! Your student profile has been promoted to a Community Ambassador account to assist in onboarding underprivileged students in your area.",
        details={"role": "ambassador", "promoted_at": datetime.now(timezone.utc).isoformat()}
    )
    db.session.commit()
    return jsonify({"user": user.to_dict(), "ticket": ticket.to_dict()}), 200


# ── Stats ─────────────────────────────────────────────────

@admin_bp.get("/stats")
@role_required(Role.ADMIN.value)
def stats():
    total = StudentProfile.query.count()
    pending = StudentProfile.query.filter_by(status=ProfileStatus.PENDING.value).count()
    approved = StudentProfile.query.filter_by(status=ProfileStatus.APPROVED.value).count()
    rejected = StudentProfile.query.filter_by(status=ProfileStatus.REJECTED.value).count()
    users = User.query.count()
    return jsonify({
        "total_profiles": total,
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "total_users": users,
    }), 200

@admin_bp.get("/export-pdf")
@role_required(Role.ADMIN.value)
def export_pdf():
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter

    total = StudentProfile.query.count()
    pending = StudentProfile.query.filter_by(status=ProfileStatus.PENDING.value).count()
    approved = StudentProfile.query.filter_by(status=ProfileStatus.APPROVED.value).count()
    rejected = StudentProfile.query.filter_by(status=ProfileStatus.REJECTED.value).count()
    users = User.query.count()
    
    from ...models import Contribution
    total_funds = db.session.query(db.func.sum(Contribution.amount)).scalar() or 0

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, 750, "igaFund System Analytics Report")
    
    c.setFont("Helvetica", 12)
    c.drawString(50, 720, f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    
    c.drawString(50, 680, "User Statistics:")
    c.drawString(70, 660, f"- Total Registered Users: {users}")
    
    c.drawString(50, 620, "Profile Statistics:")
    c.drawString(70, 600, f"- Total Profiles Submitted: {total}")
    c.drawString(70, 580, f"- Approved: {approved}")
    c.drawString(70, 560, f"- Pending: {pending}")
    c.drawString(70, 540, f"- Rejected: {rejected}")
    
    c.drawString(50, 500, "Financial Statistics:")
    c.drawString(70, 480, f"- Total Funds Raised: {total_funds:,.2f} RWF")
    
    c.showPage()
    c.save()
    
    buffer.seek(0)
    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"igaFund_Analytics_{datetime.now().strftime('%Y%m%d')}.pdf",
        mimetype="application/pdf"
    )
