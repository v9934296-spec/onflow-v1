"""Production R2 credentials live under conventional S3_* names on Railway."""

from __future__ import annotations

import pytest

from app.core.config import Settings
from app.services.object_storage import S3Storage, build_storage


def _clear(monkeypatch: pytest.MonkeyPatch) -> None:
    for name in (
        "ONFLOW_S3_BUCKET",
        "ONFLOW_S3_ENDPOINT",
        "ONFLOW_S3_ACCESS_KEY",
        "ONFLOW_S3_SECRET_KEY",
        "S3_BUCKET",
        " S3_BUCKET",
        "S3_ENDPOINT",
        " S3_ENDPOINT",
        "S3_ACCESS_KEY_ID",
        " S3_ACCESS_KEY_ID",
        "S3_SECRET_ACCESS_KEY",
    ):
        monkeypatch.delenv(name, raising=False)


def test_conventional_names_fill_unset_onflow_s3(monkeypatch: pytest.MonkeyPatch) -> None:
    _clear(monkeypatch)
    # Names saved with a leading space, as in the production Railway service.
    monkeypatch.setenv(" S3_BUCKET", "clips")
    monkeypatch.setenv(" S3_ENDPOINT", "https://acct.r2.cloudflarestorage.com")
    monkeypatch.setenv(" S3_ACCESS_KEY_ID", "AKID")
    monkeypatch.setenv("S3_SECRET_ACCESS_KEY", "SECRET")
    s = Settings()
    assert s.s3_configured
    assert s.s3_bucket == "clips"
    assert s.s3_access_key == "AKID"


def test_onflow_names_win(monkeypatch: pytest.MonkeyPatch) -> None:
    _clear(monkeypatch)
    monkeypatch.setenv("ONFLOW_S3_BUCKET", "primary")
    monkeypatch.setenv("S3_BUCKET", "fallback")
    assert Settings().s3_bucket == "primary"


def test_build_storage_uses_resolved_settings(monkeypatch: pytest.MonkeyPatch) -> None:
    _clear(monkeypatch)
    monkeypatch.setenv("S3_BUCKET", "clips")
    monkeypatch.setenv("S3_ENDPOINT", "https://acct.r2.cloudflarestorage.com")
    monkeypatch.setenv("S3_ACCESS_KEY_ID", "AKID")
    monkeypatch.setenv("S3_SECRET_ACCESS_KEY", "SECRET")
    from app.core.config import get_settings

    get_settings.cache_clear()
    try:
        assert isinstance(build_storage(), S3Storage)
    finally:
        get_settings.cache_clear()
