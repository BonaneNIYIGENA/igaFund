"""Admin verification + management endpoints."""
from datetime import datetime, timezone
from pathlib import Path
import io
from flask import Blueprint, request, jsonify, send_file, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import Schema, fields, validate, ValidationError

from ...extensions import db
from ...models import (
    User, Role, StudentProfile, ProfileStatus,
    AuditLog, Notification, Document, DocType,
)
from ...common.decorators import role_required
from ...common.mailer import send_email
from ...common.email_templates import profile_approved as tpl_approved, profile_rejected as tpl_rejected, ambassador_promoted as tpl_promoted

from ..tickets.routes import create_process_ticket

admin_bp = Blueprint("admin", __name__)


class ReviewSchema(Schema):
    note = fields.Str(required=True, validate=validate.Length(min=5))


def _minor_consent_blockers(profile):
    """BR3 / NFR3: a minor cannot be published without verified guardian consent."""
    if not profile.is_minor():
        return []

    blockers = []
    if not profile.guardian_consent:
        blockers.append("The guardian consent checkbox is not confirmed on the profile.")
    if not profile.guardian_name or not profile.guardian_phone:
        blockers.append("Guardian name and phone number are incomplete.")

    consent_doc = Document.query.filter_by(
        profile_id=profile.id, doc_type=DocType.GUARDIAN_CONSENT.value
    ).first()
    if not consent_doc:
        blockers.append("No signed guardian consent form has been uploaded.")
    elif not consent_doc.verified:
        blockers.append("The uploaded guardian consent form has not been marked as verified.")

    return blockers



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

    # BR3 is enforced here, at the moment of publication — not only at submit,
    # because approval is what makes a profile publicly visible.
    blockers = _minor_consent_blockers(profile)
    if blockers:
        return jsonify({
            "error": "This student is a minor and cannot be approved yet.",
            "code": "guardian_consent_incomplete",
            "blockers": blockers,
        }), 422

    admin_id = int(get_jwt_identity())

    profile.status = ProfileStatus.APPROVED.value
    profile.reviewed_at = datetime.now(timezone.utc)
    profile.review_note = data["note"]
    profile.edit_request_reason = None

    db.session.add(AuditLog(
        actor_id=admin_id,
        action="profile_approved",
        target_type="student_profile",
        target_id=profile.id,
        note=data["note"],
        ip_address=request.remote_addr,
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

    if profile.user and profile.user.email and profile.user.notify_email:
        subj, body = tpl_approved(profile.user.full_name.split(" ")[0], data["note"])
        send_email(profile.user.email, subj, body)

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
        ip_address=request.remote_addr,
    ))
    db.session.add(Notification(
        user_id=profile.user_id,
        type="warning",
        message=f"Your profile was not approved. Reason: {data['note']}",
        link="/student/profile",
    ))
    db.session.commit()

    if profile.user and profile.user.email and profile.user.notify_email:
        subj, body = tpl_rejected(profile.user.full_name.split(" ")[0], data["note"])
        send_email(profile.user.email, subj, body)

    return jsonify({"profile": profile.to_dict()}), 200


@admin_bp.post("/users/<int:user_id>/promote-ambassador")
@role_required(Role.ADMIN.value)
def promote_ambassador(user_id):
    """Promote a verified student to Community Ambassador role."""
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404
    if user.role != Role.STUDENT.value:
        return jsonify({"error": "Only students can be promoted to Community Ambassador."}), 400

    user.role = Role.AMBASSADOR.value
    db.session.add(AuditLog(
        actor_id=int(get_jwt_identity()),
        action="promoted_ambassador",
        target_type="user",
        target_id=user.id,
        note=f"Promoted student {user.full_name} to Community Ambassador",
        ip_address=request.remote_addr,
    ))
    
    ticket = create_process_ticket(
        user_id=user.id,
        process_type="ambassador_promoted",
        title="Promoted to Community Ambassador",
        summary=f"Congratulations {user.full_name}! Your student profile has been promoted to a Community Ambassador account to assist in onboarding underprivileged students in your area.",
        details={"role": "ambassador", "promoted_at": datetime.now(timezone.utc).isoformat()}
    )
    db.session.add(Notification(
        user_id=user.id,
        type="success",
        message="Congratulations! You have been promoted to Community Ambassador.",
        link="/ambassador",
    ))
    db.session.commit()

    if user.email and user.notify_email:
        subj, body = tpl_promoted(user.full_name.split(" ")[0])
        send_email(user.email, subj, body)

    return jsonify({"user": user.to_dict(), "ticket": ticket.to_dict()}), 200



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
    from reportlab.lib import colors

    total = StudentProfile.query.count()
    pending = StudentProfile.query.filter_by(status=ProfileStatus.PENDING.value).count()
    approved = StudentProfile.query.filter_by(status=ProfileStatus.APPROVED.value).count()
    rejected = StudentProfile.query.filter_by(status=ProfileStatus.REJECTED.value).count()
    users = User.query.count()
    
    from ...models import Contribution
    total_funds = db.session.query(db.func.sum(Contribution.amount)).scalar() or 0

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)

    forest = colors.HexColor("#12312A")
    sage = colors.HexColor("#6E8279")
    amber = colors.HexColor("#E8A13A")

    logo = Path(__file__).resolve().parents[3] / "frontend" / "public" / "logo.png"
    if logo.exists():
        try:
            c.drawImage(str(logo), 50, 726, width=40, height=40, mask="auto",
                        preserveAspectRatio=True)
        except Exception:
            current_app.logger.warning("Report logo could not be embedded")

    c.setFillColor(forest)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(102, 748, "igaFund")
    c.setFont("Helvetica", 11)
    c.setFillColor(sage)
    c.drawString(102, 733, "System analytics report")

    c.setStrokeColor(amber)
    c.setLineWidth(2)
    c.line(50, 716, 562, 716)

    c.setFillColor(sage)
    c.setFont("Helvetica", 9)
    c.drawString(50, 702, f"Generated {datetime.now(timezone.utc).strftime('%d %B %Y at %H:%M UTC')}")

    def section(title, rows, top):
        c.setFillColor(forest)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(50, top, title)
        c.setFont("Helvetica", 11)
        y = top - 22
        for label, value in rows:
            c.setFillColor(sage)
            c.drawString(64, y, label)
            c.setFillColor(forest)
            c.drawRightString(400, y, str(value))
            y -= 18
        return y - 14

    y = section("Users", [("Registered users", users)], 664)
    y = section("Profiles", [
        ("Submitted in total", total),
        ("Verified and published", approved),
        ("Awaiting review", pending),
        ("Changes requested", rejected),
    ], y)
    section("Funding", [("Routed to institutions", f"{total_funds:,.0f} RWF")], y)

    c.setFillColor(sage)
    c.setFont("Helvetica-Oblique", 8)
    c.drawString(50, 60, "Every amount shown was routed directly to a registered institution account.")
    c.drawString(50, 48, "No contribution is ever held in a personal account.")

    c.showPage()
    c.save()
    
    buffer.seek(0)
    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"igaFund_Analytics_{datetime.now().strftime('%Y%m%d')}.pdf",
        mimetype="application/pdf"
    )


class ChangeRoleSchema(Schema):
    role = fields.Str(required=True, validate=validate.OneOf([r.value for r in Role]))


class SuspendUserSchema(Schema):
    note = fields.Str(required=True, validate=validate.Length(min=5))


@admin_bp.get("/users")
@role_required(Role.ADMIN.value)
def list_users():
    """List all registered users with optional role and search filtering."""
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    role_filter = request.args.get("role")
    search = request.args.get("search", "").strip()

    q = User.query
    if role_filter and role_filter != "all":
        q = q.filter_by(role=role_filter)
    if search:
        q = q.filter(
            (User.full_name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%"))
        )

    pagination = q.order_by(User.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        "users": [u.to_dict() for u in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page,
    }), 200


@admin_bp.put("/users/<int:user_id>/role")
@role_required(Role.ADMIN.value)
def change_user_role(user_id):
    """Change a user's role (BR8 enforcement)."""
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404

    try:
        data = ChangeRoleSchema().load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    old_role = user.role
    user.role = data["role"]

    db.session.add(AuditLog(
        actor_id=int(get_jwt_identity()),
        action="user_role_changed",
        target_type="user",
        target_id=user.id,
        note=f"Changed role of {user.full_name} from {old_role} to {user.role}",
        ip_address=request.remote_addr,
    ))
    db.session.commit()

    return jsonify({"user": user.to_dict()}), 200


@admin_bp.post("/users/<int:user_id>/suspend")
@role_required(Role.ADMIN.value)
def toggle_suspend_user(user_id):
    """Suspend or unsuspend a user account (BR10 compliance)."""
    admin_id = int(get_jwt_identity())
    if admin_id == user_id:
        return jsonify({"error": "You cannot suspend your own admin account."}), 400

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404

    try:
        data = SuspendUserSchema().load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    user.is_suspended = not user.is_suspended
    action_str = "user_suspended" if user.is_suspended else "user_unsuspended"

    db.session.add(AuditLog(
        actor_id=admin_id,
        action=action_str,
        target_type="user",
        target_id=user.id,
        note=data["note"],
        ip_address=request.remote_addr,
    ))
    db.session.add(Notification(
        user_id=user.id,
        type="warning" if user.is_suspended else "info",
        message=f"Your account has been {'suspended' if user.is_suspended else 'reactivated'}. Reason: {data['note']}",
        link="/help",
    ))
    db.session.commit()

    return jsonify({"user": user.to_dict()}), 200

