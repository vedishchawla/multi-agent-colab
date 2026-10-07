"""Token-Bucket Rate Limiter for Google Gemini Free Tier.

Google AI Studio Free Tier has a strict quota of 15 Requests Per Minute (RPM).
This rate limiter strictly caps outbound API calls to 12 RPM (providing a 20%
safety cushion) and gracefully queues concurrent agent calls without crashing.
"""

import asyncio
import time
from typing import Dict, Any


class TokenBucketRateLimiter:
    """Asynchronous Token Bucket Rate Limiter with sliding refill."""

    def __init__(self, rpm: int = 12):
        self.rpm = max(1, rpm)
        self.capacity = float(self.rpm)
        self.tokens = float(self.rpm)
        self.fill_rate = self.capacity / 60.0  # tokens per second
        self.last_update = time.monotonic()
        self._lock = asyncio.Lock()
        self._total_acquired = 0
        self._total_wait_seconds = 0.0

    async def acquire(self) -> float:
        """Acquire permission to execute 1 LLM request.
        
        Returns the seconds waited (if any).
        """
        async with self._lock:
            now = time.monotonic()
            elapsed = now - self.last_update
            self.last_update = now

            # Refill bucket
            self.tokens = min(self.capacity, self.tokens + elapsed * self.fill_rate)

            wait_time = 0.0
            if self.tokens < 1.0:
                # Calculate required sleep duration to reach 1 token
                needed = 1.0 - self.tokens
                wait_time = needed / self.fill_rate
                self.tokens = 0.0
            else:
                self.tokens -= 1.0

            self._total_acquired += 1

        if wait_time > 0:
            self._total_wait_seconds += wait_time
            await asyncio.sleep(wait_time)

        return wait_time

    def get_telemetry(self) -> Dict[str, Any]:
        """Return diagnostic metrics about rate limiter health."""
        return {
            "configured_rpm": self.rpm,
            "available_tokens": round(self.tokens, 2),
            "total_calls_served": self._total_acquired,
            "total_wait_seconds": round(self._total_wait_seconds, 2)
        }


# Global rate limiter instance initialized from config
rate_limiter = TokenBucketRateLimiter(rpm=12)
