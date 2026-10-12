"""Tier → provider routing: Gemini only. Pro gets the richer tier-specific Gemini prompt."""

from __future__ import annotations

import pytest

from app.core.config import Settings
from app.core.tiers import (
    normalized_review_model_for_provider,
    resolve_analysis_provider_for_tier,
    resolve_gemini_model_for_tier,
)


def test_every_tier_uses_gemini_and_never_pegasus() -> None:
    settings = Settings(gemini_api_key="g", twelvelabs_api_key="t")
    for tier in ("free", "pro", "coach", "trial", "session_reup", "free_expired", None):
        provider = resolve_analysis_provider_for_tier(tier, settings)
        assert provider == "gemini"
        assert normalized_review_model_for_provider(provider) == "gemini"


def test_flash_used_for_free_and_pro_by_default() -> None:
    settings = Settings(gemini_api_key="g")
    assert resolve_gemini_model_for_tier("free", settings) == "gemini-2.5-flash"
    assert resolve_gemini_model_for_tier("pro", settings) == "gemini-2.5-flash"


def test_pro_model_can_be_swapped_independently() -> None:
    settings = Settings(gemini_api_key="g", gemini_model_pro="gemini-3.8-flash")
    assert resolve_gemini_model_for_tier("pro", settings) == "gemini-3.8-flash"
    assert resolve_gemini_model_for_tier("free", settings) == "gemini-2.5-flash"


def test_production_provider_gate_does_not_require_twelvelabs(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ONFLOW_ENV", "production")
    monkeypatch.setenv("ONFLOW_ANALYSIS_PROVIDERS_ENABLED", "true")
    monkeypatch.setenv("ONFLOW_JWT_SECRET", "x" * 32)
    monkeypatch.setenv("ONFLOW_DATABASE_URL", "postgresql://u:p@localhost/db")
    monkeypatch.setenv("ONFLOW_REDIS_URL", "redis://localhost:6379/0")
    monkeypatch.setenv("ONFLOW_ADMIN_EMAILS", "owner@onflow.test")
    monkeypatch.setenv("ONFLOW_RC_WEBHOOK_SECRET", "secret")
    monkeypatch.setenv("ONFLOW_RC_PRO_PRODUCT_IDS", "com.onflow.lite.monthly")
    monkeypatch.setenv("ONFLOW_S3_BUCKET", "bucket")
    monkeypatch.setenv("ONFLOW_S3_ENDPOINT", "https://example.com")
    monkeypatch.setenv("ONFLOW_S3_ACCESS_KEY", "access")
    monkeypatch.setenv("ONFLOW_S3_SECRET_KEY", "secret")
    monkeypatch.setenv("ONFLOW_GEMINI_API_KEY", "gemini")
    monkeypatch.delenv("ONFLOW_TWELVELABS_API_KEY", raising=False)
    assert Settings().analysis_providers_enabled is True


def test_production_provider_gate_requires_gemini(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ONFLOW_ENV", "production")
    monkeypatch.setenv("ONFLOW_ANALYSIS_PROVIDERS_ENABLED", "true")
    monkeypatch.setenv("ONFLOW_JWT_SECRET", "x" * 32)
    monkeypatch.setenv("ONFLOW_DATABASE_URL", "postgresql://u:p@localhost/db")
    monkeypatch.setenv("ONFLOW_REDIS_URL", "redis://localhost:6379/0")
    monkeypatch.setenv("ONFLOW_ADMIN_EMAILS", "owner@onflow.test")
    monkeypatch.setenv("ONFLOW_RC_WEBHOOK_SECRET", "secret")
    monkeypatch.setenv("ONFLOW_RC_PRO_PRODUCT_IDS", "com.onflow.lite.monthly")
    monkeypatch.setenv("ONFLOW_S3_BUCKET", "bucket")
    monkeypatch.setenv("ONFLOW_S3_ENDPOINT", "https://example.com")
    monkeypatch.setenv("ONFLOW_S3_ACCESS_KEY", "access")
    monkeypatch.setenv("ONFLOW_S3_SECRET_KEY", "secret")
    monkeypatch.delenv("ONFLOW_GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    with pytest.raises(ValueError, match="ONFLOW_GEMINI_API_KEY"):
        Settings()
