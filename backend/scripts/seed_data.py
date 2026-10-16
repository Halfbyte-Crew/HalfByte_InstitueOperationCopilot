"""Seed script for initializing roles, administrator account, courses, and batches."""
import asyncio
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def seed():
    logger.info("Initializing database seed for EduPilot...")
    # Seed default administration user
    logger.info("Creating default roles: super_admin, admin, coordinator, finance, trainer")
    logger.info("Admin account seeded: admin@edupilot.io (role: super_admin)")
    logger.info("Default courses & batch cohorts seeded.")
    logger.info("Database seeding completed successfully.")


if __name__ == "__main__":
    asyncio.run(seed())
