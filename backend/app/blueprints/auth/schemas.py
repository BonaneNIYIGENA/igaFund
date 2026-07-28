"""Auth request validation."""
from marshmallow import Schema, fields, validates, validates_schema, ValidationError, EXCLUDE, post_load

from ...common.validators import validate_email, validate_name, validate_password

SIGNUP_ROLES = {"student", "donor"}  # admin is seeded; ambassador is promoted


class RegisterSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    email = fields.Str(required=True)
    full_name = fields.Str(required=True)
    password = fields.Str(required=True, load_only=True)
    role = fields.Str(required=True)

    @validates("email")
    def check_email(self, value, **kwargs):
        validate_email(value)

    @validates("full_name")
    def check_name(self, value, **kwargs):
        validate_name(value, "full name")

    @validates("password")
    def check_password(self, value, **kwargs):
        validate_password(value)

    @validates("role")
    def check_role(self, value, **kwargs):
        if value not in SIGNUP_ROLES:
            raise ValidationError("Choose whether you are a student or a donor.")

    @validates_schema
    def password_is_not_personal(self, data, **kwargs):
        password = (data.get("password") or "").lower()
        email_local = (data.get("email") or "").split("@")[0].lower()
        if email_local and len(email_local) >= 4 and email_local in password:
            raise ValidationError({"password": ["Your password cannot contain your email address."]})

    @post_load
    def normalise(self, data, **kwargs):
        data["email"] = validate_email(data["email"])
        data["full_name"] = validate_name(data["full_name"], "full name")
        return data


class LoginSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    email = fields.Str(required=True)
    password = fields.Str(required=True, load_only=True)

    @post_load
    def normalise(self, data, **kwargs):
        data["email"] = (data.get("email") or "").strip().lower()
        return data


class PasswordResetRequestSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    email = fields.Str(required=True)

    @post_load
    def normalise(self, data, **kwargs):
        data["email"] = (data.get("email") or "").strip().lower()
        return data


class PasswordResetConfirmSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    token = fields.Str(required=True)
    password = fields.Str(required=True, load_only=True)

    @validates("password")
    def check_password(self, value, **kwargs):
        validate_password(value)
