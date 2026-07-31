"""Profile + document endpoints for students and ambassadors."""
import os
import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt, verify_jwt_in_request
from werkzeug.utils import secure_filename
from marshmallow import ValidationError

from ...extensions import db
from ...models import User, Role, StudentProfile, ProfileStatus, Document, DocType, Notification, WatchedProfile
from ...common.decorators import role_required
from ...common.storage import (
    delete_document, is_cloud_enabled, signed_document_url, upload_document, upload_photo,
)
from ...common.mailer import send_email
from ...common.email_templates import profile_submitted as tpl_profile_submitted, change_request_approved as tpl_change_request
from .schemas import ProfileCreateSchema, ProfileUpdateSchema, EditRequestSchema

profiles_bp = Blueprint("profiles", __name__)

ALLOWED_DOC_TYPES = {t.value for t in DocType}

# A profile is open for edits while it is a draft, or after a rejection so the
# student can fix what the reviewer flagged and resubmit (BR4 review cycle).
EDITABLE_STATUSES = {ProfileStatus.DRAFT.value, ProfileStatus.REJECTED.value}

MIME_BY_EXT = {
    "pdf": "application/pdf",
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
}

# Magic bytes, checked because a renamed script would pass an extension test.
FILE_SIGNATURES = {
    "pdf": [b"%PDF-"],
    "png": [b"\x89PNG\r\n\x1a\n"],
    "jpg": [b"\xff\xd8\xff"],
    "jpeg": [b"\xff\xd8\xff"],
}


def _signature_matches(stream, ext):
    head = stream.read(8)
    stream.seek(0)
    return any(head.startswith(sig) for sig in FILE_SIGNATURES.get(ext, []))


def _ensure_upload_dir():
    path = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(path, exist_ok=True)
    return path


def _actor():
    """(user_id, role) for the current request."""
    return int(get_jwt_identity()), get_jwt().get("role")


def _can_manage(profile, uid, role):
    """Who may edit a profile: its student, the ambassador who enrolled them (BR5), or an admin."""
    if role == Role.ADMIN.value:
        return True
    if profile.user_id == uid:
        return True
    return profile.ambassador_id is not None and profile.ambassador_id == uid


def _can_view(profile, uid, role):
    """Viewing is the same set as managing — admins additionally review every profile."""
    return _can_manage(profile, uid, role)


def _enforce_minor_media_rule(profile):
    """NFR3 safety net: a minor's photo/video can only be set once a guardian
    has consented, regardless of which endpoint touched the profile."""
    if profile.is_minor() and not profile.guardian_consent:
        profile.photo_url = None
        profile.video_url = None
        profile.media_consent = False


def _viewer_may_see_minor_media():
    """True for a signed-in donor or admin; False for an anonymous visitor.
    Never raises — an absent or invalid token just means "anonymous"."""
    try:
        verify_jwt_in_request(optional=True)
    except Exception:
        return False
    claims = get_jwt() or {}
    return claims.get("role") in (Role.DONOR.value, Role.ADMIN.value)



@profiles_bp.get("/")
@jwt_required()
def list_profiles():
    """List profiles."""
    uid, role = _actor()

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
    """Publicly browsable list of approved student profiles with PII masked.
    Minors' photos additionally stay hidden unless the viewer is a signed-in
    donor or admin (NFR3) — anonymous visitors never see a minor's face."""
    academic_level = request.args.get("academic_level")
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    q = StudentProfile.query.filter_by(status=ProfileStatus.APPROVED.value)
    if academic_level:
        q = q.filter_by(academic_level=academic_level)

    pagination = q.order_by(StudentProfile.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    may_see_minor_media = _viewer_may_see_minor_media()
    return jsonify({
        "profiles": [
            p.to_dict(public=True, viewer_may_see_minor_media=may_see_minor_media, viewer_may_see_payment_details=may_see_minor_media)
            for p in pagination.items
        ],
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page
    }), 200


@profiles_bp.get("/public/<int:profile_id>")
def get_public_profile(profile_id):
    """Single approved profile for the donor browsing portal (BR1, BR6: PII stays masked)."""
    profile = db.session.get(StudentProfile, profile_id)
    if not profile or profile.status != ProfileStatus.APPROVED.value:
        return jsonify({"error": "Not found."}), 404
    may_see_minor_media = _viewer_may_see_minor_media()
    return jsonify({
        "profile": profile.to_dict(
            public=True,
            viewer_may_see_minor_media=may_see_minor_media,
            viewer_may_see_payment_details=may_see_minor_media,
        )
    }), 200


@profiles_bp.post("/")
@jwt_required()
def create_profile():
    """Student creates their own profile, or ambassador creates on behalf of a student."""
    uid, role = _actor()

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
        student_user.set_password(data.get("on_behalf_of_password") or "Temp1234!")
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
        photo_url=data.get("photo_url"),
        media_consent=data.get("media_consent", False),
    )
    _enforce_minor_media_rule(profile)
    db.session.add(profile)
    db.session.commit()

    return jsonify({"profile": profile.to_dict()}), 201


@profiles_bp.get("/<int:profile_id>")
@jwt_required()
def get_profile(profile_id):
    profile = db.session.get(StudentProfile, profile_id)
    if not profile:
        return jsonify({"error": "Not found."}), 404

    uid, role = _actor()
    if not _can_view(profile, uid, role):
        return jsonify({"error": "Forbidden."}), 403

    return jsonify({"profile": profile.to_dict()}), 200


@profiles_bp.put("/<int:profile_id>")
@jwt_required()
def update_profile(profile_id):
    profile = db.session.get(StudentProfile, profile_id)
    if not profile:
        return jsonify({"error": "Not found."}), 404

    uid, role = _actor()
    if not _can_manage(profile, uid, role):
        return jsonify({"error": "Forbidden."}), 403
    if profile.status not in EDITABLE_STATUSES:
        # BR4: an approved profile is locked; changing it needs a review request.
        if profile.status == ProfileStatus.APPROVED.value:
            return jsonify({
                "error": "Approved profiles are locked. Request a change to reopen for review.",
                "code": "edit_request_required",
            }), 409
        return jsonify({"error": "This profile is being reviewed and cannot be edited right now."}), 409

    try:
        data = ProfileUpdateSchema().load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    for key, val in data.items():
        setattr(profile, key, val)
    _enforce_minor_media_rule(profile)
    db.session.commit()

    return jsonify({"profile": profile.to_dict()}), 200


@profiles_bp.post("/<int:profile_id>/submit")
@jwt_required()
def submit_profile(profile_id):
    """Submit a draft (or corrected, previously rejected) profile for admin review."""
    profile = db.session.get(StudentProfile, profile_id)
    if not profile:
        return jsonify({"error": "Not found."}), 404

    uid, role = _actor()
    if not _can_manage(profile, uid, role):
        return jsonify({"error": "Forbidden."}), 403
    if profile.status not in EDITABLE_STATUSES:
        return jsonify({"error": "Profile is already submitted."}), 400

    # BR3: minors need guardian consent plus the signed consent document on file.
    if profile.is_minor():
        if not profile.guardian_consent or not profile.guardian_name or not profile.guardian_phone:
            return jsonify({
                "error": "Guardian name, phone and consent are required for students under 18.",
                "code": "guardian_consent_required",
            }), 400
        has_consent_doc = profile.documents.filter_by(doc_type=DocType.GUARDIAN_CONSENT.value).first()
        if not has_consent_doc:
            return jsonify({
                "error": "Upload the signed guardian consent form before submitting.",
                "code": "guardian_consent_document_required",
            }), 400

    was_rejected = profile.status == ProfileStatus.REJECTED.value
    profile.status = ProfileStatus.PENDING.value
    profile.submitted_at = datetime.now(timezone.utc)
    db.session.commit()

    # notify admins
    verb = "resubmitted after changes" if was_rejected else "submitted"
    admins = User.query.filter_by(role=Role.ADMIN.value).all()
    for admin in admins:
        db.session.add(Notification(
            user_id=admin.id,
            type="action",
            message=f"Profile {verb} by {profile.user.full_name}.",
            link=f"/admin/profiles/{profile.id}",
        ))
    db.session.commit()

    if profile.user and profile.user.email:
        subj, body = tpl_profile_submitted(profile.user.full_name.split(" ")[0])
        send_email(profile.user.email, subj, body)

    return jsonify({"profile": profile.to_dict()}), 200


@profiles_bp.post("/<int:profile_id>/request-edit")
@jwt_required()
def request_edit(profile_id):
    """BR4: an approved profile can only change by requesting a fresh review cycle."""
    profile = db.session.get(StudentProfile, profile_id)
    if not profile:
        return jsonify({"error": "Not found."}), 404

    uid, role = _actor()
    if not _can_manage(profile, uid, role):
        return jsonify({"error": "Forbidden."}), 403
    if profile.status != ProfileStatus.APPROVED.value:
        return jsonify({"error": "Only approved profiles need a change request."}), 400

    try:
        data = EditRequestSchema().load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    profile.edit_request_reason = data["reason"]
    profile.status = ProfileStatus.PENDING.value
    profile.submitted_at = datetime.now(timezone.utc)
    profile.reviewed_at = None

    admins = User.query.filter_by(role=Role.ADMIN.value).all()
    for admin in admins:
        db.session.add(Notification(
            user_id=admin.id,
            type="action",
            message=f"{profile.user.full_name} requested a change to an approved profile.",
            link=f"/admin/profiles/{profile.id}",
        ))
    db.session.add(Notification(
        user_id=profile.user_id,
        type="info",
        message="Your change request was sent. Your profile is under review again and is paused from the donor pool.",
        link="/student/status",
    ))
    db.session.commit()

    return jsonify({"profile": profile.to_dict()}), 200



@profiles_bp.post("/<int:profile_id>/documents")
@jwt_required()
def upload_document(profile_id):
    profile = db.session.get(StudentProfile, profile_id)
    if not profile:
        return jsonify({"error": "Not found."}), 404

    uid, role = _actor()
    if not _can_manage(profile, uid, role):
        return jsonify({"error": "Forbidden."}), 403
    if profile.status not in EDITABLE_STATUSES:
        return jsonify({"error": "Documents cannot be changed while the profile is under review."}), 409

    file = request.files.get("file")
    doc_type = request.form.get("doc_type")

    if not file or not doc_type:
        return jsonify({"error": "File and doc_type are required."}), 400

    if doc_type not in ALLOWED_DOC_TYPES:
        return jsonify({"error": f"Invalid doc_type. Allowed: {', '.join(sorted(ALLOWED_DOC_TYPES))}"}), 400

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else ""
    if ext not in current_app.config["ALLOWED_EXTENSIONS"]:
        return jsonify({"error": f"File type .{ext} not allowed. Use PDF, PNG or JPG."}), 400

    if not _signature_matches(file.stream, ext):
        return jsonify({"error": "That file isn't a real PDF or image. Upload the original file."}), 400

    storage_ref, public_id = upload_document(file, ext, profile.id, doc_type=doc_type)

    doc = Document(
        profile_id=profile.id,
        doc_type=doc_type,
        original_filename=secure_filename(file.filename),
        file_path=storage_ref,
        storage_public_id=public_id,
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

    uid, role = _actor()
    if not _can_view(profile, uid, role):
        return jsonify({"error": "Forbidden."}), 403

    docs = Document.query.filter_by(profile_id=profile.id).order_by(Document.uploaded_at.desc()).all()
    return jsonify({"documents": [d.to_dict() for d in docs]}), 200


@profiles_bp.get("/<int:profile_id>/documents/<int:doc_id>/file")
@jwt_required()
def download_document(profile_id, doc_id):
    """Stream a verification document to an authorised viewer."""
    profile = db.session.get(StudentProfile, profile_id)
    if not profile:
        return jsonify({"error": "Not found."}), 404

    uid, role = _actor()
    if not _can_view(profile, uid, role):
        return jsonify({"error": "Forbidden."}), 403

    doc = db.session.get(Document, doc_id)
    if not doc or doc.profile_id != profile.id:
        return jsonify({"error": "Document not found."}), 404

    # Cloud-stored documents are private assets reached by a short-lived signed link.
    if doc.storage_public_id and is_cloud_enabled():
        signed = signed_document_url(doc.storage_public_id, doc.extension)
        if signed:
            return jsonify({"url": signed, "expires_in": 300}), 200

    if not os.path.exists(doc.file_path):
        return jsonify({"error": "The stored file is missing. Ask for it to be uploaded again."}), 410

    ext = doc.extension or doc.file_path.rsplit(".", 1)[-1].lower()
    response = send_file(
        doc.file_path,
        mimetype=MIME_BY_EXT.get(ext, "application/octet-stream"),
        as_attachment=request.args.get("download") == "1",
        download_name=doc.original_filename,
    )
    response.headers["Cache-Control"] = "private, no-store"
    return response


@profiles_bp.post("/<int:profile_id>/documents/<int:doc_id>/verify")
@role_required(Role.ADMIN.value)
def verify_document(profile_id, doc_id):
    """Admin marks a document as checked — BR3 needs consent forms actually verified."""
    doc = db.session.get(Document, doc_id)
    if not doc or doc.profile_id != profile_id:
        return jsonify({"error": "Document not found."}), 404

    payload = request.get_json() or {}
    doc.verified = bool(payload.get("verified", True))
    db.session.commit()
    return jsonify({"document": doc.to_dict()}), 200


@profiles_bp.delete("/<int:profile_id>/documents/<int:doc_id>")
@jwt_required()
def delete_document(profile_id, doc_id):
    profile = db.session.get(StudentProfile, profile_id)
    if not profile:
        return jsonify({"error": "Not found."}), 404

    uid, role = _actor()
    if not _can_manage(profile, uid, role):
        return jsonify({"error": "Forbidden."}), 403
    if profile.status not in EDITABLE_STATUSES:
        return jsonify({"error": "Documents cannot be changed while the profile is under review."}), 409

    doc = db.session.get(Document, doc_id)
    if not doc or doc.profile_id != profile.id:
        return jsonify({"error": "Document not found."}), 404

    delete_document(doc.storage_public_id, doc.extension, doc.file_path)
    db.session.delete(doc)
    db.session.commit()
    return jsonify({"message": "Deleted."}), 200


@profiles_bp.post("/<int:profile_id>/photo")
@jwt_required()
def upload_profile_photo(profile_id):
    """A portrait — shown publicly for an adult with media consent, or shown
    only to signed-in donors/admins for a minor with guardian consent (NFR3)."""
    profile = db.session.get(StudentProfile, profile_id)
    if not profile:
        return jsonify({"error": "Not found."}), 404

    uid, role = _actor()
    if not _can_manage(profile, uid, role):
        return jsonify({"error": "Forbidden."}), 403
    if profile.is_minor() and not profile.guardian_consent:
        return jsonify({
            "error": "A guardian must consent before a photo can be added for a student under 18.",
        }), 403

    file = request.files.get("file")
    if not file:
        return jsonify({"error": "Choose a photo to upload."}), 400

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else ""
    if ext not in {"png", "jpg", "jpeg"}:
        return jsonify({"error": "Upload a PNG or JPG image."}), 400
    if not _signature_matches(file.stream, ext):
        return jsonify({"error": "That file isn't a real image."}), 400

    profile.photo_url = upload_photo(file, ext)
    profile.media_consent = True
    db.session.commit()

    return jsonify({"profile": profile.to_dict()}), 200



@profiles_bp.get("/institutions")
@jwt_required()
def list_institutions():
    from ...models import Institution
    institutions = Institution.query.order_by(Institution.name).all()
    return jsonify({"institutions": [i.to_dict() for i in institutions]}), 200


# ── Donor watchlist ─────────────────────────────────────────
# A donor following a student sees their progress without having to search
# for them again; it is a bookmark, not a financial record.

@profiles_bp.post("/<int:profile_id>/watch")
@role_required(Role.DONOR.value)
def watch_profile(profile_id):
    profile = db.session.get(StudentProfile, profile_id)
    if not profile or profile.status != ProfileStatus.APPROVED.value:
        return jsonify({"error": "Only verified profiles can be followed."}), 404

    uid = int(get_jwt_identity())
    existing = WatchedProfile.query.filter_by(donor_id=uid, profile_id=profile_id).first()
    if existing:
        return jsonify({"watching": True}), 200

    db.session.add(WatchedProfile(donor_id=uid, profile_id=profile_id))
    db.session.commit()
    return jsonify({"watching": True}), 201


@profiles_bp.delete("/<int:profile_id>/watch")
@role_required(Role.DONOR.value)
def unwatch_profile(profile_id):
    uid = int(get_jwt_identity())
    existing = WatchedProfile.query.filter_by(donor_id=uid, profile_id=profile_id).first()
    if existing:
        db.session.delete(existing)
        db.session.commit()
    return jsonify({"watching": False}), 200


@profiles_bp.get("/watching")
@role_required(Role.DONOR.value)
def list_watched_profiles():
    uid = int(get_jwt_identity())
    rows = (
        WatchedProfile.query
        .filter_by(donor_id=uid)
        .order_by(WatchedProfile.created_at.desc())
        .all()
    )
    watched_ids = {r.profile_id for r in rows}
    profiles = [
        r.profile.to_dict(public=True, viewer_may_see_minor_media=True, viewer_may_see_payment_details=True)
        for r in rows if r.profile
    ]
    return jsonify({"profiles": profiles, "watched_ids": list(watched_ids)}), 200
