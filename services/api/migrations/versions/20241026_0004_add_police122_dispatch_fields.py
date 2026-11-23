"""Add Police 122 dispatch fields to call_extractions and agent_settings

Revision ID: 20241026_0004
Revises: 20241019_0003
Create Date: 2024-10-26 00:04:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '20241026_0004'
down_revision: Union[str, None] = '20241019_0003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    call_ext_cols = [c['name'] for c in inspector.get_columns('call_extractions')]
    agent_sett_cols = [c['name'] for c in inspector.get_columns('agent_settings')]

    # --- call_extractions ---
    if 'category' not in call_ext_cols:
        op.add_column('call_extractions', sa.Column('category', sa.String(100), nullable=True))
    if 'assigned_department' not in call_ext_cols:
        op.add_column('call_extractions', sa.Column('assigned_department', sa.String(100), nullable=True))
    if 'department_phone' not in call_ext_cols:
        op.add_column('call_extractions', sa.Column('department_phone', sa.String(50), nullable=True))
    if 'outbound_call_triggered' not in call_ext_cols:
        op.add_column('call_extractions', sa.Column('outbound_call_triggered', sa.Boolean(), nullable=False, server_default='false'))
    if 'outbound_call_id' not in call_ext_cols:
        op.add_column('call_extractions', sa.Column('outbound_call_id', postgresql.UUID(as_uuid=True), nullable=True))

    # --- agent_settings ---
    if 'acknowledgment_message' not in agent_sett_cols:
        op.add_column('agent_settings', sa.Column('acknowledgment_message', sa.Text(), nullable=True, server_default='تمام يا فندم، اطمن.'))
    if 'clarification_message' not in agent_sett_cols:
        op.add_column('agent_settings', sa.Column('clarification_message', sa.Text(), nullable=True, server_default='معلش يا فندم، الصوت مكنش واضح عندي خالص. ممكن تعيد عليا تاني بعد إذنك؟'))
    if 'hangup_reassurance_message' not in agent_sett_cols:
        op.add_column('agent_settings', sa.Column('hangup_reassurance_message', sa.Text(), nullable=True, server_default='تحت أمرك يا فندم، اطمن الدورية في طريقها لموقع البلاغ فوراً، وخليك في مكان آمن.'))
    if 'english_greeting' not in agent_sett_cols:
        op.add_column('agent_settings', sa.Column('english_greeting', sa.Text(), nullable=True, server_default='Egyptian Police Emergency Hotline 122. Please state your emergency?'))
    if 'english_acknowledgment_message' not in agent_sett_cols:
        op.add_column('agent_settings', sa.Column('english_acknowledgment_message', sa.Text(), nullable=True, server_default='Understood, stay calm.'))
    if 'english_clarification_message' not in agent_sett_cols:
        op.add_column('agent_settings', sa.Column('english_clarification_message', sa.Text(), nullable=True, server_default='I am sorry, the audio was not clear. Could you please repeat?'))
    if 'english_hangup_reassurance_message' not in agent_sett_cols:
        op.add_column('agent_settings', sa.Column('english_hangup_reassurance_message', sa.Text(), nullable=True, server_default='You are in good hands. The police patrol is en route immediately. Stay safe!'))
    if 'english_closing_message' not in agent_sett_cols:
        op.add_column('agent_settings', sa.Column('english_closing_message', sa.Text(), nullable=True, server_default='All your emergency report details have been dispatched to the nearest police patrol unit. Stay in a safe place, emergency services are en route!'))
    if 'departments' not in agent_sett_cols:
        op.add_column('agent_settings', sa.Column('departments', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='[]'))
    if 'categories' not in agent_sett_cols:
        op.add_column('agent_settings', sa.Column('categories', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='[]'))


def downgrade() -> None:
    # --- agent_settings ---
    op.drop_column('agent_settings', 'categories')
    op.drop_column('agent_settings', 'departments')
    op.drop_column('agent_settings', 'english_closing_message')
    op.drop_column('agent_settings', 'english_hangup_reassurance_message')
    op.drop_column('agent_settings', 'english_clarification_message')
    op.drop_column('agent_settings', 'english_acknowledgment_message')
    op.drop_column('agent_settings', 'english_greeting')
    op.drop_column('agent_settings', 'hangup_reassurance_message')
    op.drop_column('agent_settings', 'clarification_message')
    op.drop_column('agent_settings', 'acknowledgment_message')

    # --- call_extractions ---
    op.drop_column('call_extractions', 'outbound_call_id')
    op.drop_column('call_extractions', 'outbound_call_triggered')
    op.drop_column('call_extractions', 'department_phone')
    op.drop_column('call_extractions', 'assigned_department')
    op.drop_column('call_extractions', 'category')
