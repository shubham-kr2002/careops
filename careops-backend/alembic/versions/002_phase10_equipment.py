"""Phase 10: Equipment model and Contact extensions

Revision ID: 002_phase10_equipment
Revises: 001_initial_migration
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_phase10_equipment'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ─── Equipment table ─────────────────────────────────────────────────────
    op.create_table(
        'equipment',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workspaces.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('type', sa.String(100), nullable=True),
        sa.Column('serial_number', sa.String(100), nullable=True),
        sa.Column('purchase_date', sa.DateTime, nullable=True),
        sa.Column('last_maintained_at', sa.DateTime, nullable=True),
        sa.Column('maintenance_interval_days', sa.Integer, server_default='90', nullable=False),
        sa.Column('status', sa.String(50), server_default='active', nullable=False),
        sa.Column('usage_count', sa.Integer, server_default='0'),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime, server_default=sa.text('now()'), onupdate=sa.text('now()')),
    )
    op.create_index('ix_equipment_workspace_id', 'equipment', ['workspace_id'])

    # ─── Maintenance Logs table ──────────────────────────────────────────────
    op.create_table(
        'maintenance_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('equipment_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('equipment.id', ondelete='CASCADE'), nullable=False),
        sa.Column('performed_at', sa.DateTime, server_default=sa.text('now()'), nullable=False),
        sa.Column('performed_by', sa.String(200), nullable=True),
        sa.Column('maintenance_type', sa.String(50), server_default='routine', nullable=False),
        sa.Column('cost', sa.Float, nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('next_due_at', sa.DateTime, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_maintenance_logs_equipment_id', 'maintenance_logs', ['equipment_id'])

    # ─── Contact table extensions ────────────────────────────────────────────
    op.add_column('contacts', sa.Column('segment', sa.String(50), nullable=True))
    op.add_column('contacts', sa.Column('tags', postgresql.JSONB, nullable=True))
    op.add_column('contacts', sa.Column('lifetime_value', sa.Float, server_default='0', nullable=True))
    op.add_column('contacts', sa.Column('last_activity_at', sa.DateTime, nullable=True))
    op.add_column('contacts', sa.Column('total_bookings', sa.Integer, server_default='0', nullable=True))
    op.add_column('contacts', sa.Column('preferred_language', sa.String(10), server_default='en', nullable=True))


def downgrade() -> None:
    # ─── Contact columns ─────────────────────────────────────────────────────
    op.drop_column('contacts', 'preferred_language')
    op.drop_column('contacts', 'total_bookings')
    op.drop_column('contacts', 'last_activity_at')
    op.drop_column('contacts', 'lifetime_value')
    op.drop_column('contacts', 'tags')
    op.drop_column('contacts', 'segment')

    # ─── Tables ──────────────────────────────────────────────────────────────
    op.drop_index('ix_maintenance_logs_equipment_id', table_name='maintenance_logs')
    op.drop_table('maintenance_logs')
    op.drop_index('ix_equipment_workspace_id', table_name='equipment')
    op.drop_table('equipment')
