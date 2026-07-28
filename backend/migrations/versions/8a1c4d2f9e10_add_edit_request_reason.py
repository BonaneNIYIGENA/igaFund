"""add edit_request_reason to student_profiles (BR4 review cycle)

Revision ID: 8a1c4d2f9e10
Revises: 7ebd35ce0637
Create Date: 2026-07-27 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8a1c4d2f9e10'
down_revision = '7ebd35ce0637'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('student_profiles', schema=None) as batch_op:
        batch_op.add_column(sa.Column('edit_request_reason', sa.Text(), nullable=True))


def downgrade():
    with op.batch_alter_table('student_profiles', schema=None) as batch_op:
        batch_op.drop_column('edit_request_reason')
