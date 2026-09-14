"""Add plant knowledge provenance and bounded sunlight fields.

Revision ID: a4f1c9d2b7e0
Revises: 9930e188d00a
"""

from alembic import op
import sqlalchemy as sa


revision = "a4f1c9d2b7e0"
down_revision = "9930e188d00a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("plant_species") as batch_op:
        batch_op.add_column(sa.Column("sunlight_hours_ideal_min", sa.Float(), nullable=True))
        batch_op.add_column(sa.Column("sunlight_hours_ideal_max", sa.Float(), nullable=True))
        batch_op.add_column(sa.Column("source_references", sa.JSON(), nullable=True))
        batch_op.alter_column("scientific_name", existing_type=sa.String(length=255), nullable=False)
        batch_op.create_unique_constraint("uq_plant_species_scientific_name", ["scientific_name"])


def downgrade() -> None:
    with op.batch_alter_table("plant_species") as batch_op:
        batch_op.drop_constraint("uq_plant_species_scientific_name", type_="unique")
        batch_op.alter_column("scientific_name", existing_type=sa.String(length=255), nullable=True)
        batch_op.drop_column("source_references")
        batch_op.drop_column("sunlight_hours_ideal_max")
        batch_op.drop_column("sunlight_hours_ideal_min")
