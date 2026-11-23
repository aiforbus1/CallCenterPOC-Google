"""Add tts_voice to agent_settings table

Revision ID: 20241019_0003
Revises: 20241019_0002
Create Date: 2024-10-19 00:03:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '20241019_0003'
down_revision: Union[str, None] = '20241019_0002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'agent_settings',
        sa.Column('tts_voice', sa.String(50), nullable=True, server_default='Aoede')
    )


def downgrade() -> None:
    op.drop_column('agent_settings', 'tts_voice')
