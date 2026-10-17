"""create_student_accounts_and_academic_observations

Revision ID: e8a91b2c3d4e
Revises: 3d399adc6a8d
Create Date: 2026-10-17 13:48:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e8a91b2c3d4e'
down_revision: Union[str, Sequence[str], None] = '3d399adc6a8d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create student_accounts table
    op.create_table(
        'student_accounts',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('student_id', sa.UUID(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('account_status', sa.String(length=50), nullable=False, server_default=sa.text("'pending_activation'")),
        sa.Column('activation_token_hash', sa.String(length=255), nullable=True),
        sa.Column('activation_token_expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('activated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by_trainer_email', sa.String(length=255), nullable=False),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('student_id', name='uq_student_accounts_student_id'),
    )
    op.create_index(op.f('ix_student_accounts_email'), 'student_accounts', ['email'], unique=True)
    op.create_index(op.f('ix_student_accounts_student_id'), 'student_accounts', ['student_id'], unique=True)
    op.create_index(op.f('ix_student_accounts_account_status'), 'student_accounts', ['account_status'], unique=False)
    op.create_index(op.f('ix_student_accounts_activation_token_hash'), 'student_accounts', ['activation_token_hash'], unique=False)

    # 2. Create academic_observations table
    op.create_table(
        'academic_observations',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('student_id', sa.UUID(), nullable=False),
        sa.Column('batch_id', sa.UUID(), nullable=False),
        sa.Column('trainer_email', sa.String(length=255), nullable=False),
        sa.Column('trainer_name', sa.String(length=150), nullable=False),
        sa.Column('observation_type', sa.String(length=50), nullable=False, server_default=sa.text("'Feedback'")),
        sa.Column('note', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['batch_id'], ['batches.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_academic_observations_student_id'), 'academic_observations', ['student_id'], unique=False)
    op.create_index(op.f('ix_academic_observations_batch_id'), 'academic_observations', ['batch_id'], unique=False)
    op.create_index(op.f('ix_academic_observations_trainer_email'), 'academic_observations', ['trainer_email'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_academic_observations_trainer_email'), table_name='academic_observations')
    op.drop_index(op.f('ix_academic_observations_batch_id'), table_name='academic_observations')
    op.drop_index(op.f('ix_academic_observations_student_id'), table_name='academic_observations')
    op.drop_table('academic_observations')

    op.drop_index(op.f('ix_student_accounts_activation_token_hash'), table_name='student_accounts')
    op.drop_index(op.f('ix_student_accounts_account_status'), table_name='student_accounts')
    op.drop_index(op.f('ix_student_accounts_student_id'), table_name='student_accounts')
    op.drop_index(op.f('ix_student_accounts_email'), table_name='student_accounts')
    op.drop_table('student_accounts')
