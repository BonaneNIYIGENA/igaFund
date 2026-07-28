"""Contribution endpoints for donors and profiles."""
import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from marshmallow import Schema, fields, validate, ValidationError, EXCLUDE, post_load

from ...extensions import db
from ...models import User, Role, StudentProfile, ProfileStatus, Contribution, Notification, AuditLog
from ...common.decorators import role_required
from ...common.validators import clean_text
from ...common.storage import upload_receipt
from ...common.mailer import send_email
from ...common.email_templates import funding_received as tpl_funding_received, contribution_confirmation as tpl_contribution_confirmation

from ..tickets.routes import create_process_ticket, generate_ticket_number

PROOF_SIGNATURES = {
    "pdf": [b"%PDF-"],
    "png": [b"\x89PNG\r\n\x1a\n"],
    "jpg": [b"\xff\xd8\xff"],
    "jpeg": [b"\xff\xd8\xff"],
}

contributions_bp = Blueprint("contributions", __name__)


class ContributeSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    profile_id = fields.Int(required=True)
    amount = fields.Float(required=True, validate=validate.Range(min=1000))
    message = fields.Str(load_default="")
    is_anonymous = fields.Bool(load_default=False)
    # FR4.3: evidence of the transfer is mandatory, not a nicety.
    proof_image_url = fields.Str(required=True, validate=validate.Length(min=1))
    proof_public_id = fields.Str(load_default="")

    @post_load
    def scrub(self, data, **kwargs):
        data["message"] = clean_text(data.get("message", ""), 500)
        return data


class ProofUploadResponse(Schema):
    url = fields.Str()
    public_id = fields.Str()


@contributions_bp.post("/proof")
@role_required(Role.DONOR.value, Role.ADMIN.value)
def upload_proof():
    """Uploads the payment slip before the contribution itself is recorded."""
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "Choose your payment slip to upload."}), 400

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else ""
    if ext not in {"pdf", "png", "jpg", "jpeg"}:
        return jsonify({"error": "Upload a PDF, PNG or JPG of your transfer confirmation."}), 400

    head = file.stream.read(8)
    file.stream.seek(0)
    if not any(head.startswith(sig) for sig in PROOF_SIGNATURES[ext]):
        return jsonify({"error": "That file isn't a real PDF or image."}), 400

    url = upload_receipt(file, ext)
    return jsonify({"url": url}), 201


@contributions_bp.post("/")
@role_required(Role.DONOR.value, Role.ADMIN.value)
def make_contribution():
    """Donor or Admin funds a verified student profile (direct routing to institution with proof image)."""
    try:
        data = ContributeSchema().load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    donor_id = int(get_jwt_identity())
    profile = db.session.get(StudentProfile, data["profile_id"])

    if not profile:
        return jsonify({"error": "Student profile not found."}), 404

    if profile.status != ProfileStatus.APPROVED.value:
        return jsonify({"error": "Only approved profiles can receive contributions."}), 400

    if not profile.institution_id:
        return jsonify({"error": "Profile has no assigned institution for direct routing."}), 400

    receipt_ref = f"REC-{uuid.uuid4().hex[:8].upper()}"
    ticket_num = generate_ticket_number("TICK-DON")

    contribution = Contribution(
        donor_id=donor_id,
        profile_id=profile.id,
        institution_id=profile.institution_id,
        amount=data["amount"],
        message=data.get("message", ""),
        is_anonymous=data.get("is_anonymous", False),
        proof_image_url=data["proof_image_url"],
        proof_public_id=data.get("proof_public_id", ""),
        ticket_number=ticket_num,
        receipt_ref=receipt_ref,
        routed_to_institution=True,
    )

    profile.funded_amount = (profile.funded_amount or 0) + data["amount"]

    # Notify student
    donor_display = "An Anonymous Donor" if data.get("is_anonymous") else (contribution.donor.full_name if contribution.donor else "A Donor")
    db.session.add(Notification(
        user_id=profile.user_id,
        type="success",
        message=f"{donor_display} funded {data['amount']:,.0f} RWF towards your education!",
        link="/student",
    ))

    # Notify donor
    db.session.add(Notification(
        user_id=donor_id,
        type="success",
        message=f"Your contribution of {data['amount']:,.0f} RWF has been recorded!",
        link="/donor/receipts",
    ))

    db.session.add(contribution)
    db.session.add(AuditLog(
        actor_id=donor_id,
        action="contribution_created",
        target_type="contribution",
        target_id=profile.id,
        note=f"Contributed {data['amount']:,.0f} RWF to student profile #{profile.id}",
        ip_address=request.remote_addr,
    ))
    db.session.commit()

    # Create official process tickets for both Donor and Student
    create_process_ticket(
        user_id=donor_id,
        process_type="contribution_funded",
        title="Direct Institution Payment Processed",
        summary=f"Contributed {data['amount']:,.0f} RWF directly to {profile.institution.name if profile.institution else 'Institution'} for student {profile.user.full_name if profile.user else 'Student'}.",
        details={
            "ticket_number": ticket_num,
            "receipt_ref": receipt_ref,
            "amount": data["amount"],
            "institution": profile.institution.name if profile.institution else None,
            "bank_reference": profile.institution.bank_reference if profile.institution else None,
            "proof_image_url": data.get("proof_image_url"),
        }
    )

    create_process_ticket(
        user_id=profile.user_id,
        process_type="funding_received",
        title="Educational Funding Payment Received",
        summary=f"Received {data['amount']:,.0f} RWF routed directly to {profile.institution.name if profile.institution else 'your school'}.",
        details={
            "ticket_number": ticket_num,
            "receipt_ref": receipt_ref,
            "amount": data["amount"],
            "institution": profile.institution.name if profile.institution else None,
        }
    )

    # Emails
    inst_name = profile.institution.name if profile.institution else "your registered institution"
    if profile.user and profile.user.email and profile.user.notify_email:
        subj, body = tpl_funding_received(
            profile.user.full_name.split(" ")[0],
            data["amount"],
            donor_display,
            inst_name
        )
        send_email(profile.user.email, subj, body)

    donor_user = db.session.get(User, donor_id)
    if donor_user and donor_user.email and donor_user.notify_email:
        student_name = profile.user.full_name if profile.user else "Student"
        subj, body = tpl_contribution_confirmation(
            donor_user.full_name.split(" ")[0],
            data["amount"],
            student_name,
            inst_name,
            receipt_ref
        )
        send_email(donor_user.email, subj, body)

    return jsonify({
        "contribution": contribution.to_dict(),
        "funded_amount": profile.funded_amount,
        "funding_goal": profile.funding_goal,
    }), 201


PUBLIC_CONTRIBUTION_FIELDS = ("id", "donor_name", "amount", "currency", "message", "created_at")


@contributions_bp.get("/profile/<int:profile_id>")
@jwt_required()
def list_profile_contributions(profile_id):
    """Contributions and donor messages for a profile."""
    profile = db.session.get(StudentProfile, profile_id)
    if not profile:
        return jsonify({"error": "Profile not found."}), 404

    uid, role = int(get_jwt_identity()), get_jwt().get("role")
    privileged = (
        role == Role.ADMIN.value
        or profile.user_id == uid
        or (profile.ambassador_id is not None and profile.ambassador_id == uid)
    )

    contributions = (
        Contribution.query
        .filter_by(profile_id=profile.id)
        .order_by(Contribution.created_at.desc())
        .all()
    )

    if privileged:
        payload = [c.to_dict() for c in contributions]
    else:
        payload = []
        for c in contributions:
            full = c.to_dict()
            row = {k: full[k] for k in PUBLIC_CONTRIBUTION_FIELDS}
            # A donor always sees their own contribution in full detail.
            if c.donor_id == uid:
                row = full
            payload.append(row)

    return jsonify({"contributions": payload}), 200


@contributions_bp.get("/my")
@jwt_required()
def list_my_contributions():
    """List contributions made by the current user."""
    uid = int(get_jwt_identity())
    contributions = (
        Contribution.query
        .filter_by(donor_id=uid)
        .order_by(Contribution.created_at.desc())
        .all()
    )
    return jsonify({"contributions": [c.to_dict() for c in contributions]}), 200
