"""Add vad_silence_timeout_seconds, chat_model, and stt_model to agent_settings

Revision ID: 20241122_0005
Revises: 20241026_0004
Create Date: 2024-11-22 00:05:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '20241122_0005'
down_revision: Union[str, None] = '20241026_0004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    agent_sett_cols = [c['name'] for c in inspector.get_columns('agent_settings')]

    if 'vad_silence_timeout_seconds' not in agent_sett_cols:
        op.add_column(
            'agent_settings',
            sa.Column('vad_silence_timeout_seconds', sa.Float(), nullable=True, server_default='1.8')
        )
    if 'chat_model' not in agent_sett_cols:
        op.add_column(
            'agent_settings',
            sa.Column('chat_model', sa.String(100), nullable=True, server_default='google/gemini-2.5-flash')
        )
    if 'stt_model' not in agent_sett_cols:
        op.add_column(
            'agent_settings',
            sa.Column('stt_model', sa.String(100), nullable=True, server_default='openai/whisper-large-v3')
        )


def downgrade() -> None:
    op.drop_column('agent_settings', 'stt_model')
    op.drop_column('agent_settings', 'chat_model')
    op.drop_column('agent_settings', 'vad_silence_timeout_seconds')
