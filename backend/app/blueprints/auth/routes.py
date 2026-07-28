"""Auth endpoints: register, login, refresh, me."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required, get_jwt_identity, get_jwt,
)
from marshmallow import Schema, fields, EXCLUDE, ValidationError
from ...extensions import db
from ...models import User, AuditLog
from ...common.mailer import send_email
from ...common.tokens import make_reset_token, read_reset_token
from ...common.security import rate_limit, clear_rate_limit
from ...common.sessions import issue_session, touch_session, revoke_session
from .schemas import (
    RegisterSchema, LoginSchema,
    PasswordResetRequestSchema, PasswordResetConfirmSchema,
)
from ...common.email_templates import welcome_student, welcome_donor, password_reset as password_reset_tpl

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
@rate_limit("register", limit=5, window_seconds=900)
def register():
    try:
        data = RegisterSchema().load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already registered."}), 409
    user = User(email=data["email"], full_name=data["full_name"], role=data["role"])
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()

    # If student, create initial profile with DOB
    if user.role == "student":
        from ...models import StudentProfile
        dob = data.get("date_of_birth")
        profile = StudentProfile(user_id=user.id, date_of_birth=dob)
        db.session.add(profile)
        db.session.commit()

    db.session.add(AuditLog(
        actor_id=user.id,
        action="user_registered",
        target_type="user",
        target_id=user.id,
        note=f"User registered with role {user.role}",
        ip_address=request.remote_addr,
    ))
    db.session.commit()

    # Welcome email — logged to console if SMTP is not configured.
    tpl = welcome_student if data["role"] == "student" else welcome_donor
    subj, body = tpl(user.full_name.split(" ")[0])
    send_email(user.email, subj, body)

    return jsonify({"user": user.to_dict(), **issue_session(user)}), 201


@auth_bp.post("/login")
@rate_limit("login", limit=8, window_seconds=300)
def login():
    try:
        data = LoginSchema().load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400
    user = User.query.filter_by(email=data["email"]).first()
    if not user or not user.check_password(data["password"]):
        if user:
            db.session.add(AuditLog(
                actor_id=user.id,
                action="login_failed",
                target_type="user",
                target_id=user.id,
                note="Invalid password attempt",
                ip_address=request.remote_addr,
            ))
            db.session.commit()
        # One message for both cases so the response cannot enumerate accounts.
        return jsonify({"error": "That email and password don't match."}), 401

    if user.is_suspended:
        db.session.add(AuditLog(
            actor_id=user.id,
            action="login_blocked_inactive",
            target_type="user",
            target_id=user.id,
            note="Inactive user attempted login",
            ip_address=request.remote_addr,
        ))
        db.session.commit()
        return jsonify({"error": "Your account has been inactive for so long. Please contact administration for reactivation."}), 403

    clear_rate_limit("login")

    db.session.add(AuditLog(
        actor_id=user.id,
        action="login_success",
        target_type="user",
        target_id=user.id,
        note="User logged in successfully",
        ip_address=request.remote_addr,
    ))
    db.session.commit()
    return jsonify({"user": user.to_dict(), **issue_session(user)}), 200


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    claims = get_jwt()
    sid = claims.get("sid")
    touch_session(sid)
    access_claims = {"role": claims.get("role"), "sid": sid}
    return jsonify({"access": create_access_token(identity=get_jwt_identity(), additional_claims=access_claims)}), 200


@auth_bp.post("/logout")
@jwt_required()
def logout():
    sid = get_jwt().get("sid")
    revoke_session(sid)
    return jsonify({"message": "Signed out."}), 200


@auth_bp.get("/me")
@jwt_required()
def me():
    user = db.session.get(User, int(get_jwt_identity()))
    return jsonify({"user": user.to_dict()}), 200


class UpdateSettingsSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    full_name = fields.Str(load_default=None)
    email = fields.Str(load_default=None)
    current_password = fields.Str(load_default=None)
    new_password = fields.Str(load_default=None)
    notify_email = fields.Bool(load_default=None)


@auth_bp.put("/me")
@jwt_required()
def update_settings():
    """Update profile settings (full_name, email, password) with audit logging."""
    from ...common.validators import validate_name, validate_email, validate_password

    user = db.session.get(User, int(get_jwt_identity()))
    if not user:
        return jsonify({"error": "User not found."}), 404

    try:
        data = UpdateSettingsSchema().load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    changes = []

    if data.get("full_name"):
        try:
            new_name = validate_name(data["full_name"], "full name")
            if new_name != user.full_name:
                user.full_name = new_name
                changes.append("full name")
        except ValidationError as e:
            return jsonify({"errors": {"full_name": e.messages}}), 400

    if data.get("email"):
        try:
            new_email = validate_email(data["email"])
            if new_email != user.email:
                if User.query.filter(User.email == new_email, User.id != user.id).first():
                    return jsonify({"errors": {"email": ["An account already uses that email."]}}), 409
                user.email = new_email
                changes.append("email address")
        except ValidationError as e:
            return jsonify({"errors": {"email": e.messages}}), 400

    if data.get("current_password") and not data.get("new_password"):
        if not user.check_password(data["current_password"]):
            return jsonify({"errors": {"current_password": ["Current password is incorrect."]}}), 400
        return jsonify({"valid": True, "message": "Password verified successfully."}), 200

    if data.get("new_password"):
        current_pass = data.get("current_password") or ""
        if not current_pass or not user.check_password(current_pass):
            return jsonify({"errors": {"current_password": ["Current password is incorrect."]}}), 400
        try:
            validate_password(data["new_password"])
            user.set_password(data["new_password"])
            changes.append("password")
        except ValidationError as e:
            return jsonify({"errors": {"new_password": e.messages}}), 400

    if data.get("notify_email") is not None and data["notify_email"] != user.notify_email:
        user.notify_email = data["notify_email"]
        changes.append("email notification preference")

    if not changes:
        return jsonify({"user": user.to_dict(), "message": "No changes made."}), 200

    db.session.add(AuditLog(
        actor_id=user.id,
        action="user_settings_updated",
        target_type="user",
        target_id=user.id,
        note=f"Updated profile settings ({', '.join(changes)})",
        ip_address=request.remote_addr,
    ))
    db.session.commit()

    return jsonify({"user": user.to_dict(), "message": "Settings updated successfully."}), 200


@auth_bp.post("/verify-password")
@jwt_required()
def verify_password():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user:
        return jsonify({"error": "User not found."}), 404
    data = request.get_json() or {}
    password = data.get("password", "")
    if not password or not user.check_password(password):
        return jsonify({"errors": {"current_password": ["Current password is incorrect."]}}), 400
    return jsonify({"valid": True, "message": "Password verified successfully."}), 200


@auth_bp.post("/password-reset/request")
@rate_limit("reset", limit=5, window_seconds=900)
def password_reset_request():
    try:
        data = PasswordResetRequestSchema().load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400
    user = User.query.filter_by(email=data["email"]).first()
    if not user:
        return jsonify({
            "error": "No account was found with that email.",
            "code": "account_not_found",
        }), 404
    token = make_reset_token(user.id)
    subj, body = password_reset_tpl(user.full_name.split(" ")[0], token)
    send_email(user.email, subj, body)
    return jsonify({"message": "A password reset link has been sent to that email."}), 200


@auth_bp.post("/password-reset/confirm")
def password_reset_confirm():
    try:
        data = PasswordResetConfirmSchema().load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400
    user_id = read_reset_token(data["token"])
    user = db.session.get(User, user_id) if user_id is not None else None
    if not user:
        return jsonify({"error": "Invalid or expired token."}), 400
    user.set_password(data["password"])
    db.session.commit()
    return jsonify({"message": "Password updated."}), 200
