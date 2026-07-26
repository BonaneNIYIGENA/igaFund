"""Auth request validation."""
import re
from marshmallow import Schema, fields, validates, ValidationError

PASSWORD_RE = re.compile(r"^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$")
SIGNUP_ROLES = {"student", "donor"}  # admin is seeded; ambassador is promoted from verified student profiles


def _validate_password(value):
    if not PASSWORD_RE.match(value):
        raise ValidationError("Password needs 8+ chars, an uppercase, a number, and a symbol.")


class RegisterSchema(Schema):
    email = fields.Email(required=True)
    full_name = fields.Str(required=True)
    password = fields.Str(required=True, load_only=True)
    role = fields.Str(required=True)

    @validates("password")
    def check_password(self, value, **kwargs):
        _validate_password(value)

    @validates("role")
    def check_role(self, value, **kwargs):
        if value not in SIGNUP_ROLES:
            raise ValidationError("Invalid role.")


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True)


class PasswordResetRequestSchema(Schema):
    email = fields.Email(required=True)


class PasswordResetConfirmSchema(Schema):
    token = fields.Str(required=True)
    password = fields.Str(required=True, load_only=True)

    @validates("password")
    def check_password(self, value, **kwargs):
        _validate_password(value)
