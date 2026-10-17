"""create_counselor_operations_tables

Revision ID: c5d2e1a3b4f6
Revises: a4a1bf946898
Create Date: 2026-10-17 11:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c5d2e1a3b4f6'
down_revision: Union[str, Sequence[str], None] = 'a4a1bf946898'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add assigned_counselor_email to students table
    op.add_column('students', sa.Column('assigned_counselor_email', sa.String(length=255), nullable=True))
    op.create_index(op.f('ix_students_assigned_counselor_email'), 'students', ['assigned_counselor_email'], unique=False)

    # 2. Create enquiries table
    op.create_table(
        'enquiries',
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=30), nullable=True),
        sa.Column('course_id', sa.UUID(), nullable=True),
        sa.Column('course_name', sa.String(length=255), nullable=True),
        sa.Column('source', sa.String(length=100), nullable=False, server_default='Website'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='New'),
        sa.Column('assigned_counselor_email', sa.String(length=255), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('last_contact_date', sa.Date(), nullable=True),
        sa.Column('next_follow_up_date', sa.Date(), nullable=True),
        sa.Column('converted_to_student_id', sa.UUID(), nullable=True),
        sa.Column('converted_to_admission_id', sa.UUID(), nullable=True),
        sa.Column('converted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['converted_to_student_id'], ['students.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_enquiries_name'), 'enquiries', ['name'], unique=False)
    op.create_index(op.f('ix_enquiries_email'), 'enquiries', ['email'], unique=False)
    op.create_index(op.f('ix_enquiries_course_id'), 'enquiries', ['course_id'], unique=False)
    op.create_index(op.f('ix_enquiries_status'), 'enquiries', ['status'], unique=False)
    op.create_index(op.f('ix_enquiries_source'), 'enquiries', ['source'], unique=False)
    op.create_index(op.f('ix_enquiries_assigned_counselor_email'), 'enquiries', ['assigned_counselor_email'], unique=False)
    op.create_index(op.f('ix_enquiries_next_follow_up_date'), 'enquiries', ['next_follow_up_date'], unique=False)

    # 3. Create admissions table
    op.create_table(
        'admissions',
        sa.Column('enquiry_id', sa.UUID(), nullable=True),
        sa.Column('student_id', sa.UUID(), nullable=True),
        sa.Column('student_name', sa.String(length=150), nullable=False),
        sa.Column('student_email', sa.String(length=255), nullable=False),
        sa.Column('student_phone', sa.String(length=30), nullable=True),
        sa.Column('course_id', sa.UUID(), nullable=True),
        sa.Column('course_title', sa.String(length=255), nullable=False),
        sa.Column('batch_id', sa.UUID(), nullable=True),
        sa.Column('assigned_counselor_email', sa.String(length=255), nullable=False),
        sa.Column('stage', sa.String(length=50), nullable=False, server_default='Application Started'),
        sa.Column('application_date', sa.Date(), nullable=False),
        sa.Column('documents_required', sa.JSON(), nullable=True),
        sa.Column('pending_requirements', sa.Text(), nullable=True),
        sa.Column('last_activity', sa.String(length=255), nullable=True),
        sa.Column('next_action', sa.String(length=255), nullable=True),
        sa.Column('follow_up_due_date', sa.Date(), nullable=True),
        sa.Column('approval_request_id', sa.UUID(), nullable=True),
        sa.Column('admin_notes', sa.Text(), nullable=True),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['enquiry_id'], ['enquiries.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['batch_id'], ['batches.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['approval_request_id'], ['approval_requests.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_admissions_student_name'), 'admissions', ['student_name'], unique=False)
    op.create_index(op.f('ix_admissions_student_email'), 'admissions', ['student_email'], unique=False)
    op.create_index(op.f('ix_admissions_assigned_counselor_email'), 'admissions', ['assigned_counselor_email'], unique=False)
    op.create_index(op.f('ix_admissions_stage'), 'admissions', ['stage'], unique=False)
    op.create_index(op.f('ix_admissions_follow_up_due_date'), 'admissions', ['follow_up_due_date'], unique=False)

    # 4. Add foreign key for enquiries.converted_to_admission_id
    op.create_foreign_key(
        'fk_enquiries_converted_to_admission_id',
        'enquiries', 'admissions',
        ['converted_to_admission_id'], ['id'],
        ondelete='SET NULL'
    )

    # 5. Create counselor_tasks table
    op.create_table(
        'counselor_tasks',
        sa.Column('enquiry_id', sa.UUID(), nullable=True),
        sa.Column('student_id', sa.UUID(), nullable=True),
        sa.Column('admission_id', sa.UUID(), nullable=True),
        sa.Column('assigned_counselor_email', sa.String(length=255), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('due_datetime', sa.DateTime(timezone=True), nullable=False),
        sa.Column('priority', sa.String(length=20), nullable=False, server_default='Medium'),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='Pending'),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('rescheduled_from_id', sa.UUID(), nullable=True),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['enquiry_id'], ['enquiries.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['admission_id'], ['admissions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['rescheduled_from_id'], ['counselor_tasks.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_counselor_tasks_assigned_counselor_email'), 'counselor_tasks', ['assigned_counselor_email'], unique=False)
    op.create_index(op.f('ix_counselor_tasks_due_datetime'), 'counselor_tasks', ['due_datetime'], unique=False)
    op.create_index(op.f('ix_counselor_tasks_priority'), 'counselor_tasks', ['priority'], unique=False)
    op.create_index(op.f('ix_counselor_tasks_status'), 'counselor_tasks', ['status'], unique=False)

    # 6. Create interaction_logs table
    op.create_table(
        'interaction_logs',
        sa.Column('enquiry_id', sa.UUID(), nullable=True),
        sa.Column('student_id', sa.UUID(), nullable=True),
        sa.Column('admission_id', sa.UUID(), nullable=True),
        sa.Column('counselor_email', sa.String(length=255), nullable=False),
        sa.Column('interaction_type', sa.String(length=50), nullable=False, server_default='Call'),
        sa.Column('summary', sa.String(length=255), nullable=False),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['enquiry_id'], ['enquiries.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['admission_id'], ['admissions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_interaction_logs_counselor_email'), 'interaction_logs', ['counselor_email'], unique=False)


def downgrade() -> None:
    op.drop_table('interaction_logs')
    op.drop_table('counselor_tasks')
    op.drop_constraint('fk_enquiries_converted_to_admission_id', 'enquiries', type_='foreignkey')
    op.drop_table('admissions')
    op.drop_table('enquiries')
    op.drop_index(op.f('ix_students_assigned_counselor_email'), table_name='students')
    op.drop_column('students', 'assigned_counselor_email')
