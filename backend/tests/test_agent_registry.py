"""Unit tests for Agent Registry and Dynamic Specialist Creation."""

from app.agents.registry import AgentRegistry, SpecialistProfile


def test_builtin_specialists_exist():
    """Verify standard built-in specialist personas are registered."""
    registry = AgentRegistry()
    specialists = registry.list_all()

    assert len(specialists) >= 5
    names = [s.agent_name for s in specialists]
    assert "MarketResearchAgent" in names
    assert "RegulatoryComplianceAgent" in names
    assert "FinancialModelingAgent" in names
    assert "TechnicalArchitectureAgent" in names


def test_resolve_builtin_specialist_by_name():
    """Verify lookup by exact or partial name."""
    registry = AgentRegistry()
    profile = registry.resolve_specialist("RegulatoryComplianceAgent")
    assert profile.agent_name == "RegulatoryComplianceAgent"
    assert "Compliance" in profile.domain or "Regulatory" in profile.role_title


def test_dynamic_specialist_creation_for_arbitrary_domain():
    """Verify that a novel domain dynamically fabricates an agent profile."""
    registry = AgentRegistry()
    profile = registry.resolve_specialist(
        name_or_role="BioethicsSafetySpecialist",
        domain_hint="Gene Editing Clinical Bioethics"
    )

    assert profile is not None
    assert profile.is_dynamic is True
    assert "Bioethics" in profile.agent_name
    assert "Clinical Bioethics" in profile.domain
    assert len(profile.system_instruction) > 20
