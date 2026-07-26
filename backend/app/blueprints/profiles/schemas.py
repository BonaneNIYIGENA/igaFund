"""Profiles request validation."""
from datetime import date
from marshmallow import Schema, fields, validates, ValidationError


class ProfileCreateSchema(Schema):
    bio = fields.Str(load_default="")
    date_of_birth = fields.Date(load_default=None)
    phone = fields.Str(load_default=None)
    institution_id = fields.Int(load_default=None)
    academic_level = fields.Str(load_default=None)
    field_of_study = fields.Str(load_default=None)
    funding_goal = fields.Float(load_default=0)
    guardian_name = fields.Str(load_default=None)
    guardian_phone = fields.Str(load_default=None)
    guardian_consent = fields.Bool(load_default=False)
    video_url = fields.Str(load_default=None)
    media_consent = fields.Bool(load_default=False)
    # ambassador-assisted enrollment
    on_behalf_of_email = fields.Email(load_default=None)
    on_behalf_of_name = fields.Str(load_default=None)
    on_behalf_of_password = fields.Str(load_default=None)

    @validates("date_of_birth")
    def dob_not_future(self, value, **kwargs):
        if value and value > date.today():
            raise ValidationError("Date of birth cannot be in the future.")


class ProfileUpdateSchema(Schema):
    bio = fields.Str()
    date_of_birth = fields.Date()
    phone = fields.Str()
    institution_id = fields.Int()
    academic_level = fields.Str()
    field_of_study = fields.Str()
    funding_goal = fields.Float()
    guardian_name = fields.Str()
    guardian_phone = fields.Str()
    guardian_consent = fields.Bool()
    video_url = fields.Str()
    media_consent = fields.Bool()
