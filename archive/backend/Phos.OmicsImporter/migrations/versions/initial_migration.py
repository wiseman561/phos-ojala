"""Create initial tables

Revision ID: 0001
Revises: 
Create Date: 2023-11-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create omics_raw table
    op.create_table(
        'omics_raw',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_type', sa.String(length=50), nullable=False),
        sa.Column('file_content', sa.Text(), nullable=False),
        sa.Column('sample_count', sa.Integer(), nullable=True),
        sa.Column('gene_count', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('processed', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_omics_raw_id'), 'omics_raw', ['id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_omics_raw_id'), table_name='omics_raw')
    op.drop_table('omics_raw') 