"""Add assessment contract version, status, structured answers, and submission timestamp.

Revision ID: b2db890ac17a
Revises: d3f8c2a4e917
Create Date: 2026-09-16 10:18:22.540369

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2db890ac17a'
down_revision: Union[str, Sequence[str], None] = 'd3f8c2a4e917'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("assessments") as batch_op:
        batch_op.add_column(sa.Column("contract_version", sa.Integer(), server_default="1", nullable=False))
        batch_op.add_column(sa.Column("status", sa.String(length=20), server_default="in_progress", nullable=False))
        batch_op.add_column(sa.Column("structured_answers", sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("assessments") as batch_op:
        batch_op.drop_column("submitted_at")
        batch_op.drop_column("structured_answers")
        batch_op.drop_column("status")
        batch_op.drop_column("contract_version")
