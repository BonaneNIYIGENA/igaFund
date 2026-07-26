"""Profile + document endpoints for students and ambassadors."""
import os
import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from werkzeug.utils import secure_filename
from marshmallow import ValidationError

from ...extensions import db
from ...models import User, Role, StudentProfile, ProfileStatus, Document, DocType, Notification
from ...common.decorators import role_required
from .schemas import ProfileCreateSchema, ProfileUpdateSchema

profiles_bp = Blueprint("profiles", __name__)

ALLOWED_DOC_TYPES = {t.value for t in DocType}


def _ensure_upload_dir():
    path = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(path, exist_ok=True)
    return path


# ── Profile CRUD ──────────────────────────────────────────────

@profiles_bp.get("/")
@jwt_required()
def list_profiles():
    """List profiles. Admin sees all; student sees own; ambassador sees own enrollees."""
    claims = get_jwt()
    uid = int(get_jwt_identity())
    role = claims.get("role")

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    if role == Role.ADMIN.value:
        status = request.args.get("status")
        q = StudentProfile.query
        if status:
            q = q.filter_by(status=status)
        pagination = q.order_by(StudentProfile.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    elif role == Role.AMBASSADOR.value:
        pagination = StudentProfile.query.filter_by(ambassador_id=uid).order_by(StudentProfile.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    else:
        pagination = StudentProfile.query.filter_by(user_id=uid).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "profiles": [p.to_dict() for p in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page
    }), 200


@profiles_bp.get("/public")
def list_public_profiles():
    """Publicly browsable list of approved student profiles with PII & minor visual media hidden."""
    academic_level = request.args.get("academic_level")
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    q = StudentProfile.query.filter_by(status=ProfileStatus.APPROVED.value)
    if academic_level:
        q = q.filter_by(academic_level=academic_level)
    
    pagination = q.order_by(StudentProfile.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        "profiles": [p.to_dict(public=True) for p in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page
    }), 200


@profiles_bp.post("/")
@jwt_required()
def create_profile():
    """Student creates their own profile, or ambassador creates on behalf of a student."""
    claims = get_jwt()
    uid = int(get_jwt_identity())
    role = claims.get("role")

    if role not in (Role.STUDENT.value, Role.AMBASSADOR.value):
        return jsonify({"error": "Only students and ambassadors can create profiles."}), 403

    try:
        data = ProfileCreateSchema().load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    # ambassador-assisted enrollment: create a student user first
    if role == Role.AMBASSADOR.value:
        if not data.get("on_behalf_of_email") or not data.get("on_behalf_of_name"):
            return jsonify({"error": "Ambassador must provide student email and name."}), 400
        existing = User.query.filter_by(email=data["on_behalf_of_email"]).first()
        if existing:
            return jsonify({"error": "Student email already registered."}), 409
        student_user = User(
            email=data["on_behalf_of_email"],
            full_name=data["on_behalf_of_name"],
            role=Role.STUDENT.value,
        )
        student_user.set_password(data.get("on_behalf_of_password", "Temp1234!"))
        db.session.add(student_user)
        db.session.flush()
        target_uid = student_user.id
        ambassador_id = uid
    else:
        # student self-enrollment — one profile only
        if StudentProfile.query.filter_by(user_id=uid).first():
            return jsonify({"error": "You already have a profile."}), 409
        target_uid = uid
        ambassador_id = None

    profile = StudentProfile(
        user_id=target_uid,
        ambassador_id=ambassador_id,
        bio=data.get("bio", ""),
        date_of_birth=data.get("date_of_birth"),
        phone=data.get("phone"),
        institution_id=data.get("institution_id"),
        academic_level=data.get("academic_level"),
        field_of_study=data.get("field_of_study"),
        funding_goal=data.get("funding_goal", 0),
        guardian_name=data.get("guardian_name"),
        guardian_phone=data.get("guardian_phone"),
        guardian_consent=data.get("guardian_consent", False),
        video_url=data.get("video_url"),
        media_consent=data.get("media_consent", False),
    )
    db.session.add(profile)
    db.session.commit()

    return jsonify({"profile": profile.to_dict()}), 201


@profiles_bp.get("/<int:profile_id>")
@jwt_required()
def get_profile(profile_id):
    profile = db.session.get(StudentProfile, profile_id)
    if not profile:
        return jsonify({"error": "Not found."}), 404

    uid = int(get_jwt_identity())
    role = get_jwt().get("role")
    if role != Role.ADMIN.value and profile.user_id != uid and profile.ambassador_id != uid:
        return jsonify({"error": "Forbidden."}), 403

    return jsonify({"profile": profile.to_dict()}), 200


@profiles_bp.put("/<int:profile_id>")
@jwt_required()
def update_profile(profile_id):
    profile = db.session.get(StudentProfile, profile_id)
    if not profile:
        return jsonify({"error": "Not found."}), 404

    uid = int(get_jwt_identity())
    if profile.user_id != uid:
        return jsonify({"error": "Forbidden."}), 403
    if profile.status != ProfileStatus.DRAFT.value:
        return jsonify({"error": "Only draft profiles can be edited."}), 400

    try:
        data = ProfileUpdateSchema().load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    for key, val in data.items():
        setattr(profile, key, val)
    db.session.commit()

    return jsonify({"profile": profile.to_dict()}), 200


@profiles_bp.post("/<int:profile_id>/submit")
@jwt_required()
def submit_profile(profile_id):
    """Submit a draft profile for admin review."""
    profile = db.session.get(StudentProfile, profile_id)
    if not profile:
        return jsonify({"error": "Not found."}), 404

    uid = int(get_jwt_identity())
    if profile.user_id != uid:
        return jsonify({"error": "Forbidden."}), 403
    if profile.status != ProfileStatus.DRAFT.value:
        return jsonify({"error": "Profile is already submitted."}), 400

    # BR3: minor must have guardian consent
    if profile.is_minor() and not profile.guardian_consent:
        return jsonify({"error": "Guardian consent is required for minors."}), 400

    profile.status = ProfileStatus.PENDING.value
    profile.submitted_at = datetime.now(timezone.utc)
    db.session.commit()

    # notify admins
    admins = User.query.filter_by(role=Role.ADMIN.value).all()
    for admin in admins:
        db.session.add(Notification(
            user_id=admin.id,
            type="action",
            message=f"New profile submitted by {profile.user.full_name}.",
            link=f"/admin/profiles/{profile.id}",
        ))
    db.session.commit()

    return jsonify({"profile": profile.to_dict()}), 200


# ── Document uploads ──────────────────────────────────────────

@profiles_bp.post("/<int:profile_id>/documents")
@jwt_required()
def upload_document(profile_id):
    profile = db.session.get(StudentProfile, profile_id)
    if not profile:
        return jsonify({"error": "Not found."}), 404

    uid = int(get_jwt_identity())
    if profile.user_id != uid:
        return jsonify({"error": "Forbidden."}), 403

    file = request.files.get("file")
    doc_type = request.form.get("doc_type")

    if not file or not doc_type:
        return jsonify({"error": "File and doc_type are required."}), 400

    if doc_type not in ALLOWED_DOC_TYPES:
        return jsonify({"error": f"Invalid doc_type. Allowed: {', '.join(ALLOWED_DOC_TYPES)}"}), 400

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in current_app.config["ALLOWED_EXTENSIONS"]:
        return jsonify({"error": f"File type .{ext} not allowed."}), 400

    upload_dir = _ensure_upload_dir()
    safe_name = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(upload_dir, safe_name)
    file.save(file_path)

    doc = Document(
        profile_id=profile.id,
        doc_type=doc_type,
        original_filename=secure_filename(file.filename),
        file_path=file_path,
    )
    db.session.add(doc)
    db.session.commit()

    return jsonify({"document": doc.to_dict()}), 201


@profiles_bp.get("/<int:profile_id>/documents")
@jwt_required()
def list_documents(profile_id):
    profile = db.session.get(StudentProfile, profile_id)
    if not profile:
        return jsonify({"error": "Not found."}), 404

    uid = int(get_jwt_identity())
    role = get_jwt().get("role")
    if role != Role.ADMIN.value and profile.user_id != uid and profile.ambassador_id != uid:
        return jsonify({"error": "Forbidden."}), 403

    docs = Document.query.filter_by(profile_id=profile.id).order_by(Document.uploaded_at.desc()).all()
    return jsonify({"documents": [d.to_dict() for d in docs]}), 200


@profiles_bp.delete("/<int:profile_id>/documents/<int:doc_id>")
@jwt_required()
def delete_document(profile_id, doc_id):
    profile = db.session.get(StudentProfile, profile_id)
    if not profile:
        return jsonify({"error": "Not found."}), 404

    uid = int(get_jwt_identity())
    if profile.user_id != uid:
        return jsonify({"error": "Forbidden."}), 403
    if profile.status != ProfileStatus.DRAFT.value:
        return jsonify({"error": "Cannot modify documents after submission."}), 400

    doc = db.session.get(Document, doc_id)
    if not doc or doc.profile_id != profile.id:
        return jsonify({"error": "Document not found."}), 404

    # remove physical file
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    db.session.delete(doc)
    db.session.commit()
    return jsonify({"message": "Deleted."}), 200


# ── Institutions (simple list) ─────────────────────────────

@profiles_bp.get("/institutions")
@jwt_required()
def list_institutions():
    from ...models import Institution
    institutions = Institution.query.order_by(Institution.name).all()
    return jsonify({"institutions": [i.to_dict() for i in institutions]}), 200
