from marshmallow import Schema, fields, validate

class InstitutionSchema(Schema):
    name = fields.Str(required=True)
    location = fields.Str(required=True)
    type = fields.Str(validate=validate.OneOf(["secondary", "university", "tvet"]), missing="secondary")
    bank_reference = fields.Str(required=False)
