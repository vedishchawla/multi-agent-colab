"""Pytest Configuration and Fixtures for CollaborAI."""

import pytest
import pytest_asyncio
from app.db.session import init_db


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    """Ensure database schema is created before every test."""
    await init_db()
