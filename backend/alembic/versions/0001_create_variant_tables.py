"""create variant tables

Revision ID: 0001_create_variant_tables
Revises: 
Create Date: 2025-11-12 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001_create_variant_tables'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'product_variants',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('color', sa.String(), nullable=False),
        sa.Column('color_code', sa.String(), nullable=True),
    )
    op.create_table(
        'variant_images',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('variant_id', sa.Integer(), nullable=False),
        sa.Column('image_url', sa.String(), nullable=False),
    )
    op.create_table(
        'variant_sizes',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('variant_id', sa.Integer(), nullable=False),
        sa.Column('size', sa.String(), nullable=False),
        sa.Column('stock', sa.Integer(), nullable=False, server_default='0'),
    )


def downgrade():
    op.drop_table('variant_sizes')
    op.drop_table('variant_images')
    op.drop_table('product_variants')
