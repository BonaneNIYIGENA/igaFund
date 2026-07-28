"""Signed, expiring tokens for password reset."""
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from flask import current_app

RESET_SALT = "password-reset"


def make_reset_token(user_id):
    s = URLSafeTimedSerializer(current_app.config["SECRET_KEY"])
    return s.dumps(user_id, salt=RESET_SALT)


def read_reset_token(token, max_age=1800):
    s = URLSafeTimedSerializer(current_app.config["SECRET_KEY"])
    try:
        return s.loads(token, salt=RESET_SALT, max_age=max_age)
    except (BadSignature, SignatureExpired):
        return None
