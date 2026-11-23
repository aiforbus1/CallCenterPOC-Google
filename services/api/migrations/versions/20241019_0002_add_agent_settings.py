"""Add agent_settings table

Revision ID: 20241019_0002
Revises: 20241001_0001
Create Date: 2024-10-19 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '20241019_0002'
down_revision: Union[str, None] = '20241001_0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'agent_settings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('key', sa.String(50), nullable=False, server_default='default'),
        sa.Column('arabic_greeting', sa.Text(), nullable=False),
        sa.Column('questions', postgresql.JSONB, nullable=False, server_default='[]'),
        sa.Column('closing_message', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),

        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_agent_settings_key', 'agent_settings', ['key'], unique=True)


def downgrade() -> None:
    op.drop_table('agent_settings')
