"""add_password_hash_to_staff_members

Revision ID: f1b2c3d4e5f6
Revises: e8a91b2c3d4e
Create Date: 2026-10-17 14:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from app.core.security import get_password_hash


# revision identifiers, used by Alembic.
revision: str = 'f1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'e8a91b2c3d4e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add password_hash column to staff_members table
    op.add_column(
        'staff_members',
        sa.Column('password_hash', sa.String(length=255), nullable=True)
    )

    # 2. Seed existing staff members with default password hash for "admin123"
    default_hash = get_password_hash("admin123")
    op.execute(
        sa.text(f"UPDATE staff_members SET password_hash = :p_hash WHERE password_hash IS NULL").bindparams(p_hash=default_hash)
    )


def downgrade() -> None:
    op.drop_column('staff_members', 'password_hash')
