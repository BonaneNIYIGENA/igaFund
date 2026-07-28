"""user suspension, audit ip, notification prefs, donor watchlist

Revision ID: b7e2f4a91c56
Revises: a3f7c1d90b22
Create Date: 2026-07-29 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = 'b7e2f4a91c56'
down_revision = 'a3f7c1d90b22'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('is_suspended', sa.Boolean(), nullable=False, server_default=sa.false()))
        batch_op.add_column(sa.Column('notify_email', sa.Boolean(), nullable=False, server_default=sa.true()))

    with op.batch_alter_table('audit_logs', schema=None) as batch_op:
        batch_op.add_column(sa.Column('ip_address', sa.String(length=45), nullable=True))

    op.create_table(
        'watched_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('donor_id', sa.Integer(), nullable=False),
        sa.Column('profile_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['donor_id'], ['users.id']),
        sa.ForeignKeyConstraint(['profile_id'], ['student_profiles.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('donor_id', 'profile_id', name='uq_donor_profile_watch'),
    )
    with op.batch_alter_table('watched_profiles', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_watched_profiles_donor_id'), ['donor_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_watched_profiles_profile_id'), ['profile_id'], unique=False)


def downgrade():
    op.drop_table('watched_profiles')

    with op.batch_alter_table('audit_logs', schema=None) as batch_op:
        batch_op.drop_column('ip_address')

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('notify_email')
        batch_op.drop_column('is_suspended')
