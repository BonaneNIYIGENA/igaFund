"""store cloud storage ids for documents and contribution proofs

Revision ID: a3f7c1d90b22
Revises: 9b2d5e3a7c41
Create Date: 2026-07-28 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'a3f7c1d90b22'
down_revision = '9b2d5e3a7c41'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('documents', schema=None) as batch_op:
        batch_op.add_column(sa.Column('storage_public_id', sa.String(length=255), nullable=True))

    with op.batch_alter_table('contributions', schema=None) as batch_op:
        batch_op.add_column(sa.Column('proof_public_id', sa.String(length=255), nullable=True))


def downgrade():
    with op.batch_alter_table('contributions', schema=None) as batch_op:
        batch_op.drop_column('proof_public_id')

    with op.batch_alter_table('documents', schema=None) as batch_op:
        batch_op.drop_column('storage_public_id')
