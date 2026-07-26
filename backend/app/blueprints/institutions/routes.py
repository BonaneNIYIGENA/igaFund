from flask import Blueprint, request, jsonify
from marshmallow import ValidationError
from ...extensions import db
from ...models import Institution
from ...common.decorators import role_required
from .schemas import InstitutionSchema

institutions_bp = Blueprint("institutions", __name__)

@institutions_bp.get("/")
def list_institutions():
    institutions = Institution.query.all()
    return jsonify({"institutions": [i.to_dict() for i in institutions]}), 200

@institutions_bp.post("/")
@role_required("admin")
def create_institution():
    try:
        data = InstitutionSchema().load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    institution = Institution(
        name=data["name"],
        location=data["location"],
        type=data.get("type", "secondary"),
        bank_reference=data.get("bank_reference")
    )
    db.session.add(institution)
    db.session.commit()
    return jsonify({"institution": institution.to_dict()}), 201
