"""Add normalized helpfulness and reasons to feedback.

Revision ID: d3f8c2a4e917
Revises: c7e2a5f1b904

The legacy Boolean `helpful` cannot represent the Phase 9 ternary
(helpful | partially_helpful | not_helpful) plus a reasons list, so two
nullable columns are added. Existing columns and rows are untouched.
"""

from alembic import op
import sqlalchemy as sa


revision = "d3f8c2a4e917"
down_revision = "c7e2a5f1b904"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("feedback") as batch_op:
        batch_op.add_column(sa.Column("helpfulness", sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column("reasons", sa.JSON(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("feedback") as batch_op:
        batch_op.drop_column("reasons")
        batch_op.drop_column("helpfulness")
