import pytest
from app.config import Settings
from app.llm.gemini import GeminiProvider
from app.schemas.agent_io import GoalDecompositionOutput

def test_settings_parses_comma_separated_keys():
    s = Settings(GEMINI_API_KEY="key_alpha, key_beta, key_gamma")
    keys = s.gemini_api_keys
    assert len(keys) == 3
    assert keys == ["key_alpha", "key_beta", "key_gamma"]

def test_gemini_provider_multi_key_rotation():
    provider = GeminiProvider(api_key="key_1, key_2, key_3")
    assert len(provider.api_keys) == 3
    assert provider.current_api_key == "key_1"

    # Rotate to next key
    rotated = provider.rotate_key()
    assert rotated is True
    assert provider.current_api_key == "key_2"

    # Rotate to third key
    rotated = provider.rotate_key()
    assert rotated is True
    assert provider.current_api_key == "key_3"

    # Wrap around to first key
    rotated = provider.rotate_key()
    assert rotated is True
    assert provider.current_api_key == "key_1"

@pytest.mark.asyncio
async def test_gemini_provider_graceful_degradation_fallback():
    # Provider with dummy non-working key
    provider = GeminiProvider(api_key="invalid_dummy_key_12345")
    
    # generate_structured should NOT raise an unhandled exception;
    # it must gracefully fall back to simulation provider
    result = await provider.generate_structured(
        prompt="Should we deploy AI in hospitals?",
        response_model=GoalDecompositionOutput
    )
    assert isinstance(result, GoalDecompositionOutput)
    assert len(result.decomposed_workstreams) > 0
    assert len(result.activated_specialists) > 0
