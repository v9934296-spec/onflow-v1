"""PERSONALIZATION-001 — one skater profile row per user.

Revision ID: 20260908_skater_profiles
Revises: 20260824_clips_captured_at
Create Date: 2026-09-08
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260908_skater_profiles"
down_revision = "20260824_clips_captured_at"
branch_labels = None
depends_on = None

TABLE_NAME = "skater_profiles"


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if inspector.has_table(TABLE_NAME):
        return
    op.create_table(
        TABLE_NAME,
        sa.Column("user_id", sa.String(length=64), primary_key=True),
        sa.Column("natural_stance", sa.String(length=16), nullable=True),
        sa.Column("skate_styles_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("primary_skate_style", sa.String(length=16), nullable=True),
        sa.Column("experience_level", sa.String(length=32), nullable=True),
        sa.Column("age_range", sa.String(length=16), nullable=True),
        sa.Column("city", sa.String(length=100), nullable=True),
        sa.Column("home_park", sa.String(length=150), nullable=True),
        sa.Column("favorite_brands_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("onboarding_completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if not inspector.has_table(TABLE_NAME):
        return
    op.drop_table(TABLE_NAME)
