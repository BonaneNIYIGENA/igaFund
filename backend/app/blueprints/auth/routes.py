"""Auth endpoints: register, login, refresh, me."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt,
)
from marshmallow import ValidationError
from ...extensions import db
from ...models import User
from ...common.mailer import send_email
from ...common.tokens import make_reset_token, read_reset_token
from .schemas import (
    RegisterSchema, LoginSchema,
    PasswordResetRequestSchema, PasswordResetConfirmSchema,
)

auth_bp = Blueprint("auth", __name__)


def _tokens(user):
    claims = {"role": user.role}
    return {
        "access": create_access_token(identity=str(user.id), additional_claims=claims),
        "refresh": create_refresh_token(identity=str(user.id), additional_claims=claims),
    }


@auth_bp.post("/register")
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
    return jsonify({"user": user.to_dict(), **_tokens(user)}), 201


@auth_bp.post("/login")
def login():
    try:
        data = LoginSchema().load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400
    user = User.query.filter_by(email=data["email"]).first()
    if not user or not user.check_password(data["password"]):
        return jsonify({"error": "Invalid credentials."}), 401
    return jsonify({"user": user.to_dict(), **_tokens(user)}), 200


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    claims = {"role": get_jwt().get("role")}
    return jsonify({"access": create_access_token(identity=get_jwt_identity(), additional_claims=claims)}), 200


@auth_bp.get("/me")
@jwt_required()
def me():
    user = db.session.get(User, int(get_jwt_identity()))
    return jsonify({"user": user.to_dict()}), 200


@auth_bp.post("/password-reset/request")
def password_reset_request():
    try:
        data = PasswordResetRequestSchema().load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400
    user = User.query.filter_by(email=data["email"]).first()
    if user:
        token = make_reset_token(user.id)
        send_email(user.email, "Reset your igaFund password", f"Reset token: {token}")
    # never reveal whether the email exists
    return jsonify({"message": "If that email exists, a reset link has been sent."}), 200


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
