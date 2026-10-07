"""Unit tests for TokenBucketRateLimiter."""

import pytest
import asyncio
from app.llm.rate_limiter import TokenBucketRateLimiter


@pytest.mark.asyncio
async def test_rate_limiter_instant_acquisition():
    """Verify rate limiter allows immediate calls when bucket has full capacity."""
    limiter = TokenBucketRateLimiter(rpm=60)
    wait_time = await limiter.acquire()
    assert wait_time == 0.0

    telemetry = limiter.get_telemetry()
    assert telemetry["configured_rpm"] == 60
    assert telemetry["total_calls_served"] == 1


@pytest.mark.asyncio
async def test_rate_limiter_enforces_capacity():
    """Verify rate limiter consumes tokens properly."""
    limiter = TokenBucketRateLimiter(rpm=12)
    assert limiter.tokens == 12.0

    for _ in range(5):
        await limiter.acquire()

    assert limiter.tokens < 12.0
    telemetry = limiter.get_telemetry()
    assert telemetry["total_calls_served"] == 5
