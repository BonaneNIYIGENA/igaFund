from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from marshmallow import ValidationError

from ...extensions import db
from ...models import Institution, StudentProfile, ProfileStatus, Contribution, Role
from ...common.decorators import role_required
from .schemas import InstitutionSchema

institutions_bp = Blueprint("institutions", __name__)


@institutions_bp.get("/")
@jwt_required()
def list_institutions():
    """Every registered institution with the headline numbers behind it."""
    is_admin = get_jwt().get("role") == Role.ADMIN.value
    institutions = Institution.query.order_by(Institution.name).all()

    payload = []
    for inst in institutions:
        profiles = StudentProfile.query.filter_by(institution_id=inst.id).all()
        routed = (
            db.session.query(db.func.sum(Contribution.amount))
            .filter(Contribution.institution_id == inst.id)
            .scalar()
            or 0
        )
        row = inst.to_dict()
        row.update({
            "applicants": len(profiles),
            "approved": sum(1 for p in profiles if p.status == ProfileStatus.APPROVED.value),
            "pending": sum(1 for p in profiles if p.status == ProfileStatus.PENDING.value),
            "funded_students": sum(1 for p in profiles if (p.funded_amount or 0) > 0),
            "total_routed": float(routed),
            "bank_reference": inst.bank_reference if is_admin else _mask(inst.bank_reference),
        })
        payload.append(row)

    return jsonify({"institutions": payload}), 200


@institutions_bp.get("/<int:institution_id>")
@jwt_required()
def institution_detail(institution_id):
    """Statistics for one institution and the students funded through it."""
    inst = db.session.get(Institution, institution_id)
    if not inst:
        return jsonify({"error": "Institution not found."}), 404

    is_admin = get_jwt().get("role") == Role.ADMIN.value
    profiles = StudentProfile.query.filter_by(institution_id=inst.id).all()
    routed = (
        db.session.query(db.func.sum(Contribution.amount))
        .filter(Contribution.institution_id == inst.id)
        .scalar()
        or 0
    )
    contribution_count = Contribution.query.filter_by(institution_id=inst.id).count()

    def percent(p):
        goal = p.funding_goal or 0
        return min(100.0, ((p.funded_amount or 0) / goal * 100)) if goal > 0 else 0.0

    # Only approved profiles are ever exposed here (BR1); PII stays masked (BR6).
    approved = [p for p in profiles if p.status == ProfileStatus.APPROVED.value]
    ranked = sorted(
        approved,
        key=lambda p: (percent(p) >= 100, percent(p), p.funded_amount or 0),
        reverse=True,
    )

    students = []
    for p in ranked:
        row = p.to_dict(public=not is_admin)
        row["funding_percent"] = round(percent(p), 1)
        row["fully_funded"] = percent(p) >= 100
        students.append(row)

    detail = inst.to_dict()
    detail.update({
        "bank_reference": inst.bank_reference if is_admin else _mask(inst.bank_reference),
        "applicants": len(profiles),
        "approved": len(approved),
        "pending": sum(1 for p in profiles if p.status == ProfileStatus.PENDING.value),
        "rejected": sum(1 for p in profiles if p.status == ProfileStatus.REJECTED.value),
        "funded_students": sum(1 for p in approved if (p.funded_amount or 0) > 0),
        "fully_funded_students": sum(1 for p in approved if percent(p) >= 100),
        "total_routed": float(routed),
        "total_goal": float(sum(p.funding_goal or 0 for p in approved)),
        "contribution_count": contribution_count,
    })

    return jsonify({"institution": detail, "students": students}), 200


@institutions_bp.post("/")
@role_required(Role.ADMIN.value)
def create_institution():
    try:
        data = InstitutionSchema().load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    institution = Institution(
        name=data["name"],
        location=data["location"],
        type=data.get("type", "secondary"),
        bank_reference=data.get("bank_reference"),
    )
    db.session.add(institution)
    db.session.commit()
    return jsonify({"institution": institution.to_dict()}), 201


def _mask(reference):
    """Donors see enough of the account to recognise it, not enough to reuse it."""
    if not reference:
        return None
    tail = reference[-4:]
    return f"{'•' * max(4, len(reference) - 4)}{tail}"
