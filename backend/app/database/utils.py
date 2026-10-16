"""Database helper utilities for table inspection, migrations, and initialization."""
import logging
from sqlalchemy import text
from app.database.session import engine
from app.database.base import Base

logger = logging.getLogger(__name__)


async def init_db() -> bool:
    """Create all tables registered with SQLAlchemy Base metadata if they don't exist."""
    try:
        async with engine.begin() as conn:
            # Import models dynamically or directly before running to register metadata
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables verified / created successfully.")
        return True
    except Exception as exc:
        logger.error(f"Failed to initialize database tables: {exc}")
        raise exc


async def test_connection() -> bool:
    """Quick boolean check to see if database can execute queries."""
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1;"))
            return result.scalar() == 1
    except Exception as exc:
        logger.warning(f"Connection test failed: {exc}")
        return False


async def get_database_version() -> str:
    """Retrieve the PostgreSQL server version."""
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SHOW server_version;"))
            row = result.fetchone()
            return row[0] if row else "unknown"
    except Exception as exc:
        logger.error(f"Could not retrieve database version: {exc}")
        return f"error: {exc}"
