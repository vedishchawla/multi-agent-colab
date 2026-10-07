"""SQLAlchemy 2.0 ORM Models for CollaborAI Persistence."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import (
    String,
    Text,
    Float,
    Integer,
    Boolean,
    DateTime,
    JSON,
    ForeignKey
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base


class RunModel(Base):
    """Execution run table storing metadata and state snapshot."""
    __tablename__ = "runs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    goal: Mapped[str] = mapped_column(Text, nullable=False)
    constraints: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(32), default="pending")
    state_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    benchmark_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    findings: Mapped[List["FindingModel"]] = relationship(
        "FindingModel", back_populates="run", cascade="all, delete-orphan"
    )
    conflicts: Mapped[List["ConflictModel"]] = relationship(
        "ConflictModel", back_populates="run", cascade="all, delete-orphan"
    )
    escalations: Mapped[List["EscalationModel"]] = relationship(
        "EscalationModel", back_populates="run", cascade="all, delete-orphan"
    )
    events: Mapped[List["EventModel"]] = relationship(
        "EventModel", back_populates="run", cascade="all, delete-orphan"
    )


class FindingModel(Base):
    """Shared blackboard findings ledger table."""
    __tablename__ = "findings"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    run_id: Mapped[str] = mapped_column(String(64), ForeignKey("runs.id"), nullable=False)
    agent_name: Mapped[str] = mapped_column(String(128), nullable=False)
    topic: Mapped[str] = mapped_column(String(256), nullable=False)
    claim: Mapped[str] = mapped_column(Text, nullable=False)
    assertions: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    assumptions: Mapped[List[str]] = mapped_column(JSON, default=list)
    confidence: Mapped[float] = mapped_column(Float, default=0.85)
    evidence: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(32), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    run: Mapped["RunModel"] = relationship("RunModel", back_populates="findings")


class ConflictModel(Base):
    """Detected cross-agent conflicts table."""
    __tablename__ = "conflicts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    run_id: Mapped[str] = mapped_column(String(64), ForeignKey("runs.id"), nullable=False)
    agents_involved: Mapped[List[str]] = mapped_column(JSON, default=list)
    incompatible_finding_ids: Mapped[List[str]] = mapped_column(JSON, default=list)
    conflict_type: Mapped[str] = mapped_column(String(64), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(32), default="high")
    status: Mapped[str] = mapped_column(String(32), default="detected")
    resolution_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    run: Mapped["RunModel"] = relationship("RunModel", back_populates="conflicts")
    negotiations: Mapped[List["NegotiationModel"]] = relationship(
        "NegotiationModel", back_populates="conflict", cascade="all, delete-orphan"
    )


class NegotiationModel(Base):
    """Multi-agent negotiation debate rounds table."""
    __tablename__ = "negotiations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    conflict_id: Mapped[str] = mapped_column(String(64), ForeignKey("conflicts.id"), nullable=False)
    round_number: Mapped[int] = mapped_column(Integer, default=1)
    proposals: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    compromise_achieved: Mapped[bool] = mapped_column(Boolean, default=False)
    synthesis_statement: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    conflict: Mapped["ConflictModel"] = relationship("ConflictModel", back_populates="negotiations")


class EscalationModel(Base):
    """Human escalation tickets table."""
    __tablename__ = "escalations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    run_id: Mapped[str] = mapped_column(String(64), ForeignKey("runs.id"), nullable=False)
    conflict_id: Mapped[str] = mapped_column(String(64), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    human_decision: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="pending")
    escalated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    run: Mapped["RunModel"] = relationship("RunModel", back_populates="escalations")


class EventModel(Base):
    """Chronological event log table."""
    __tablename__ = "execution_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    run_id: Mapped[str] = mapped_column(String(64), ForeignKey("runs.id"), nullable=False)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    agent_name: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    title: Mapped[str] = mapped_column(String(256), default="")
    data: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    run: Mapped["RunModel"] = relationship("RunModel", back_populates="events")
