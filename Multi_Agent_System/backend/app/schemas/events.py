"""WebSocket Real-Time Event Schemas for CollaborAI Live Graph Streaming."""

from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class WSEventType(str, Enum):
    # Lifecycle
    RUN_STARTED = "RUN_STARTED"
    RUN_COMPLETED = "RUN_COMPLETED"
    RUN_FAILED = "RUN_FAILED"
    RUN_PAUSED_FOR_HUMAN = "RUN_PAUSED_FOR_HUMAN"
    RUN_RESUMED = "RUN_RESUMED"

    # Agent states
    AGENT_STATUS_UPDATED = "AGENT_STATUS_UPDATED"
    WORKSTREAMS_DECOMPOSED = "WORKSTREAMS_DECOMPOSED"
    
    # Blackboard
    FINDING_POSTED = "FINDING_POSTED"
    FINDING_UPDATED = "FINDING_UPDATED"
    
    # Conflicts & Negotiations
    CONFLICT_DETECTED = "CONFLICT_DETECTED"
    NEGOTIATION_ROUND_STARTED = "NEGOTIATION_ROUND_STARTED"
    NEGOTIATION_PROPOSAL_POSTED = "NEGOTIATION_PROPOSAL_POSTED"
    NEGOTIATION_RESOLVED = "NEGOTIATION_RESOLVED"
    STALE_ASSUMPTION_FLAGGED = "STALE_ASSUMPTION_FLAGGED"
    
    # Human Escalation
    HUMAN_ESCALATION_TRIGGERED = "HUMAN_ESCALATION_TRIGGERED"
    HUMAN_DECISION_RECEIVED = "HUMAN_DECISION_RECEIVED"
    
    # Final Output
    FINAL_SYNTHESIS_COMPLETED = "FINAL_SYNTHESIS_COMPLETED"


class WSEvent(BaseModel):
    """Payload pushed to WebSocket clients for live UI updates."""
    event_type: WSEventType
    run_id: str
    agent_name: Optional[str] = None
    title: str = Field(default="", description="Short human-friendly title")
    message: str = Field(default="", description="Descriptive narrative")
    payload: Dict[str, Any] = Field(default_factory=dict, description="Structured event payload")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
