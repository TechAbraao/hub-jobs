"""str to uuid in users table

Revision ID: ec7ed034de95
Revises: e18aaf024a97
Create Date: 2026-11-11 18:24:03.193817

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ec7ed034de95'
down_revision = 'e18aaf024a97'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column(
            'id',
            existing_type=sa.VARCHAR(length=200),
            type_=sa.Uuid(),
            existing_nullable=False,
            postgresql_using='id::uuid',
        )


def downgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column(
            'id',
            existing_type=sa.Uuid(),
            type_=sa.VARCHAR(length=200),
            existing_nullable=False,
            postgresql_using='id::text',
        )