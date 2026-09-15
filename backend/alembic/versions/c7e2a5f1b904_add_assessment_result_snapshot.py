"""Add immutable assessment result snapshot.

Revision ID: c7e2a5f1b904
Revises: a4f1c9d2b7e0

Stores the deterministic Phase 7 engine result on the assessment row so
historical display never changes when curated knowledge evolves later.
Existing rows keep NULL and are lazily backfilled on read.
"""

from alembic import op
import sqlalchemy as sa


revision = "c7e2a5f1b904"
down_revision = "a4f1c9d2b7e0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("assessments") as batch_op:
        batch_op.add_column(sa.Column("result", sa.JSON(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("assessments") as batch_op:
        batch_op.drop_column("result")
