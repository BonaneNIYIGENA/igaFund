"""add photo_url to student_profiles

Revision ID: 9b2d5e3a7c41
Revises: 8a1c4d2f9e10
Create Date: 2026-07-28 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '9b2d5e3a7c41'
down_revision = '8a1c4d2f9e10'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('student_profiles', schema=None) as batch_op:
        batch_op.add_column(sa.Column('photo_url', sa.String(length=500), nullable=True))


def downgrade():
    with op.batch_alter_table('student_profiles', schema=None) as batch_op:
        batch_op.drop_column('photo_url')
