"""Server-side input rules."""
import re
import unicodedata
from marshmallow import ValidationError

PASSWORD_MIN = 8
NAME_RE = re.compile(r"^[^\W\d_][^\W\d_\s'’-]*(?:[\s'’-][^\W\d_][^\W\d_\s'’-]*)*$", re.UNICODE)
EMAIL_RE = re.compile(
    r"^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?"
    r"@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?"
    r"(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$"
)
PHONE_RE = re.compile(r"^\+\d{7,15}$")

# Dial code -> national digit count, matching the country list in the UI.
COUNTRY_DIGITS = {
    "+250": 9, "+254": 9, "+256": 9, "+255": 9, "+257": 8, "+243": 9,
    "+251": 9, "+234": 10, "+233": 9, "+27": 9, "+44": 10, "+1": 10,
}

COMMON_PASSWORDS = (
    "password", "12345678", "qwerty", "letmein", "welcome", "admin123",
    "iloveyou", "abc12345", "password1", "11111111", "igafund",
)


def strip_controls(value):
    """Removes control characters that have no place in stored text."""
    if not isinstance(value, str):
        return value
    return "".join(
        ch for ch in value
        if ch == "\n" or (unicodedata.category(ch)[0] != "C")
    )


def validate_name(value, field="name"):
    value = strip_controls(value or "").strip()
    if not value:
        raise ValidationError(f"Enter a {field}.")
    if len(value) < 2 or len(value) > 80:
        raise ValidationError(f"A {field} must be between 2 and 80 characters.")
    if any(ch.isdigit() for ch in value):
        raise ValidationError(f"A {field} cannot contain numbers.")
    if not NAME_RE.match(value):
        raise ValidationError("Use letters only — hyphens and apostrophes are allowed.")
    return value


def validate_email(value):
    value = strip_controls(value or "").strip().lower()
    if not value:
        raise ValidationError("Enter an email address.")
    if len(value) > 254:
        raise ValidationError("That email address is too long.")
    if value.count("@") != 1:
        raise ValidationError("An email address needs exactly one @.")
    if re.search(r"[^A-Za-z0-9@._-]", value):
        raise ValidationError("Use letters, numbers, dots, hyphens and underscores only.")
    if not EMAIL_RE.match(value):
        raise ValidationError("That is not a complete email address.")
    return value


def validate_phone(value, required=False):
    value = strip_controls(value or "").strip().replace(" ", "")
    if not value:
        if required:
            raise ValidationError("Enter a phone number.")
        return ""
    if not PHONE_RE.match(value):
        raise ValidationError("Enter the number as a country code followed by digits only.")

    for dial, digits in sorted(COUNTRY_DIGITS.items(), key=lambda kv: -len(kv[0])):
        if value.startswith(dial):
            national = value[len(dial):]
            if len(national) != digits:
                raise ValidationError(f"A {dial} number must have {digits} digits after the country code.")
            return value

    raise ValidationError("That country code is not supported yet.")


def validate_password(value):
    value = value or ""
    if len(value) < PASSWORD_MIN:
        raise ValidationError(f"Your password must be at least {PASSWORD_MIN} characters.")
    if len(value) > 128:
        raise ValidationError("That password is too long.")
    lowered = value.lower()
    if any(common in lowered for common in COMMON_PASSWORDS):
        raise ValidationError("That password is too easy to guess. Choose something else.")
    if len(set(value)) < 4:
        raise ValidationError("That password repeats too few characters to be safe.")
    return value


def validate_amount(value, minimum=1, maximum=1_000_000_000):
    if value is None:
        raise ValidationError("Enter an amount.")
    try:
        amount = float(value)
    except (TypeError, ValueError):
        raise ValidationError("Enter the amount in digits only.")
    if amount != amount or amount in (float("inf"), float("-inf")):
        raise ValidationError("Enter a valid amount.")
    if amount < minimum:
        raise ValidationError(f"The smallest amount is {minimum:,.0f}.")
    if amount > maximum:
        raise ValidationError("That amount is unrealistically large.")
    return amount


def clean_text(value, max_length=2000):
    """Strips controls and angle brackets so stored prose can never carry markup."""
    value = strip_controls(value or "")
    return value.replace("<", "").replace(">", "").strip()[:max_length]
