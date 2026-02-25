"""
Alembic Environment Configuration for S.T.A.R.
Uses the app's embedded PostgreSQL engine directly.
"""
import sys
import os
from logging.config import fileConfig

from sqlalchemy import pool
from alembic import context

# Add the star-backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Import our models and engine
from app.database import engine, Base
from app.models import *  # noqa: Import all models so Alembic sees them

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Point Alembic at our models' metadata
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    from app.database import DATABASE_URL
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode using our engine directly."""
    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
