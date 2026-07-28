"""Profiles request validation."""
from datetime import date
from marshmallow import Schema, fields, validate, validates, ValidationError, EXCLUDE, post_load

from ...common.validators import (
    clean_text, validate_amount, validate_email, validate_name, validate_password, validate_phone,
)

ACADEMIC_LEVELS = {"S1", "S2", "S3", "S4", "S5", "S6", "Year 1", "Year 2", "Year 3", "Year 4", "TVET"}


class _ProfileFields(Schema):
    class Meta:
        unknown = EXCLUDE

    @validates("phone")
    def check_phone(self, value, **kwargs):
        validate_phone(value)

    @validates("guardian_phone")
    def check_guardian_phone(self, value, **kwargs):
        validate_phone(value)

    @validates("guardian_name")
    def check_guardian_name(self, value, **kwargs):
        if value:
            validate_name(value, "guardian name")

    @validates("field_of_study")
    def check_field_of_study(self, value, **kwargs):
        if value and any(ch.isdigit() for ch in value):
            raise ValidationError("A field of study cannot contain numbers.")

    @validates("funding_goal")
    def check_goal(self, value, **kwargs):
        if value is not None:
            validate_amount(value, minimum=1)

    @validates("date_of_birth")
    def dob_is_realistic(self, value, **kwargs):
        if not value:
            return
        if value > date.today():
            raise ValidationError("Date of birth cannot be in the future.")
        if value.year < date.today().year - 100:
            raise ValidationError("Check that date of birth.")

    @post_load
    def scrub(self, data, **kwargs):
        for key in ("bio",):
            if data.get(key):
                data[key] = clean_text(data[key], 1500)
        for key in ("field_of_study",):
            if data.get(key):
                data[key] = clean_text(data[key], 120)
        return data


class ProfileCreateSchema(_ProfileFields):
    bio = fields.Str(load_default="")
    date_of_birth = fields.Date(load_default=None)
    phone = fields.Str(load_default=None)
    institution_id = fields.Int(load_default=None)
    academic_level = fields.Str(load_default=None, validate=validate.OneOf(sorted(ACADEMIC_LEVELS)))
    field_of_study = fields.Str(load_default=None)
    funding_goal = fields.Float(load_default=0)
    guardian_name = fields.Str(load_default=None)
    guardian_phone = fields.Str(load_default=None)
    guardian_consent = fields.Bool(load_default=False)
    video_url = fields.Url(load_default=None, allow_none=True, schemes={"http", "https"})
    photo_url = fields.Url(load_default=None, allow_none=True, schemes={"http", "https"})
    media_consent = fields.Bool(load_default=False)
    # ambassador-assisted enrollment
    on_behalf_of_email = fields.Str(load_default=None)
    on_behalf_of_name = fields.Str(load_default=None)
    on_behalf_of_password = fields.Str(load_default=None)
    # idempotency key replayed by the offline queue
    client_id = fields.Str(load_default=None)

    @validates("on_behalf_of_email")
    def check_student_email(self, value, **kwargs):
        if value:
            validate_email(value)

    @validates("on_behalf_of_name")
    def check_student_name(self, value, **kwargs):
        if value:
            validate_name(value, "student name")

    @validates("on_behalf_of_password")
    def check_student_password(self, value, **kwargs):
        if value:
            validate_password(value)


class ProfileUpdateSchema(_ProfileFields):
    bio = fields.Str()
    date_of_birth = fields.Date()
    phone = fields.Str()
    institution_id = fields.Int()
    academic_level = fields.Str(validate=validate.OneOf(sorted(ACADEMIC_LEVELS)))
    field_of_study = fields.Str()
    funding_goal = fields.Float()
    guardian_name = fields.Str()
    guardian_phone = fields.Str()
    guardian_consent = fields.Bool()
    video_url = fields.Url(allow_none=True, schemes={"http", "https"})
    photo_url = fields.Url(allow_none=True, schemes={"http", "https"})
    media_consent = fields.Bool()


class EditRequestSchema(Schema):
    """BR4: reopening an approved profile requires a stated reason."""

    class Meta:
        unknown = EXCLUDE

    reason = fields.Str(required=True, validate=validate.Length(min=10, max=1000))

    @post_load
    def scrub(self, data, **kwargs):
        data["reason"] = clean_text(data["reason"], 1000)
        return data
