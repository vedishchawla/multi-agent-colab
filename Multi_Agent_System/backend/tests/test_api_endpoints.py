"""Integration tests for FastAPI REST API Endpoints."""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_root_endpoint():
    """Verify root serves frontend HTML and /api/status returns JSON system metadata."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Check /api/status
        status_resp = await client.get("/api/status")
        assert status_resp.status_code == 200
        data = status_resp.json()
        assert data["system"].startswith("CollaborAI")
        assert data["specification"] == "PS-27"

        # Check root page
        resp = await client.get("/")
        assert resp.status_code == 200


@pytest.mark.asyncio
async def test_scenarios_endpoint():
    """Verify demo scenarios endpoint returns the 3 presets."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/scenarios")
        assert resp.status_code == 200
        scenarios = resp.json()
        assert len(scenarios) == 3
        ids = [s["scenario_id"] for s in scenarios]
        assert "brazil_product_launch" in ids
        assert "drone_medical_delivery" in ids
        assert "fintech_ai_compliance" in ids


@pytest.mark.asyncio
async def test_specialists_roster_endpoint():
    """Verify agent registry endpoint returns available specialists."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/runs/roster/specialists")
        assert resp.status_code == 200
        specialists = resp.json()
        assert len(specialists) >= 5


@pytest.mark.asyncio
async def test_create_run_arbitrary_goal():
    """Verify creating a run with an arbitrary custom decision goal."""
    payload = {
        "goal": "Should our engineering team migrate MongoDB to PostgreSQL?",
        "constraints": [
            {
                "constraint_id": "CST-01",
                "category": "operational",
                "description": "Max downtime 2 hours",
                "is_hard_constraint": True
            }
        ],
        "simulation_mode": True
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/runs", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "state" in data
        assert data["state"]["run_id"].startswith("run-")
        assert data["state"]["goal"] == payload["goal"]
