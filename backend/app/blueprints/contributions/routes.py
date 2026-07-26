"""Contribution endpoints for donors and profiles."""
import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from marshmallow import Schema, fields, validate, ValidationError

from ...extensions import db
from ...models import User, Role, StudentProfile, ProfileStatus, Contribution, Notification
from ...common.decorators import role_required

from ..tickets.routes import create_process_ticket, generate_ticket_number

contributions_bp = Blueprint("contributions", __name__)


class ContributeSchema(Schema):
    profile_id = fields.Int(required=True)
    amount = fields.Float(required=True, validate=validate.Range(min=1000))
    message = fields.Str(load_default="")
    is_anonymous = fields.Bool(load_default=False)
    proof_image_url = fields.Str(load_default="")


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
        proof_image_url=data.get("proof_image_url", ""),
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

    db.session.add(contribution)
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

    return jsonify({
        "contribution": contribution.to_dict(),
        "funded_amount": profile.funded_amount,
        "funding_goal": profile.funding_goal,
    }), 201


@contributions_bp.get("/profile/<int:profile_id>")
def list_profile_contributions(profile_id):
    """List public contributions and donor messages for a given profile."""
    profile = db.session.get(StudentProfile, profile_id)
    if not profile:
        return jsonify({"error": "Profile not found."}), 404

    contributions = (
        Contribution.query
        .filter_by(profile_id=profile.id)
        .order_by(Contribution.created_at.desc())
        .all()
    )

    return jsonify({"contributions": [c.to_dict() for c in contributions]}), 200


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
