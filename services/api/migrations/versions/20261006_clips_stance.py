"""Persist the skater-selected stance on V1 clips across initiate → complete.

The launch client calls a trick with a stance (Regular / Switch / Nollie /
Fakie). Initiate receives it; complete-upload copies it into the clip job
metadata the worker already reads (``meta["stance"]``). Nullable: older
clients and untagged clips omit it.

Revision ID: 20261006_clips_stance
Revises: 20260908_skater_profiles
Create Date: 2026-10-06
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20261006_clips_stance"
down_revision = "20260908_skater_profiles"
branch_labels = None
depends_on = None

TABLE_NAME = "clips"
COLUMN_NAME = "stance"


def _columns_for(inspector: sa.Inspector, table: str) -> set[str]:
    return {column["name"] for column in inspector.get_columns(table)}


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if not inspector.has_table(TABLE_NAME):
        return
    if COLUMN_NAME in _columns_for(inspector, TABLE_NAME):
        return
    op.add_column(TABLE_NAME, sa.Column(COLUMN_NAME, sa.String(length=16), nullable=True))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if not inspector.has_table(TABLE_NAME):
        return
    if COLUMN_NAME not in _columns_for(inspector, TABLE_NAME):
        return
    op.drop_column(TABLE_NAME, COLUMN_NAME)
