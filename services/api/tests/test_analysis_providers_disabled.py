"""Launch configuration: no Gemini / Twelve Labs call, honest result, no charge.

Also pins the onflow-v1 payload additions (trick hint + stance reach the job
metadata), cross-account job reads, and retry-after-failure without a second
charge.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

from tests.conftest import wait_for_terminal_job
from tests.test_clip_quota_release import READABLE_FIRST_PASS


@pytest.fixture
def providers_off(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ONFLOW_ANALYSIS_PROVIDERS_ENABLED", "0")
    from app.core.config import get_settings

    get_settings.cache_clear()
    from app.services import clip_worker

    async def _no_provider(*_a: Any, **_k: Any) -> Any:
        raise AssertionError("provider must not be called when disabled")

    monkeypatch.setattr(clip_worker, "analyze_clip_with_gemini", _no_provider)
    monkeypatch.setattr(clip_worker, "analyze_clip_with_twelvelabs", _no_provider)
    monkeypatch.setattr(
        clip_worker,
        "analyze_video_first_pass",
        lambda _path: {**READABLE_FIRST_PASS, "review_readiness": "usable"},
    )


def _free_user(client: TestClient, email: str) -> tuple[str, dict[str, str]]:
    r = client.post("/api/v1/auth/session", json={"email": email})
    assert r.status_code == 200, r.text
    user_id = r.json()["user_id"]
    client.app.state.db.ensure_invite_claim_user(user_id, "free")
    return user_id, {"Authorization": f"Bearer {r.json()['session_token']}"}


def _initiate(client: TestClient, headers: dict[str, str], **extra: Any) -> dict[str, Any]:
    from app.services.video_signature import MINIMAL_VIDEO_SNIFF_BYTES

    init = client.post(
        "/api/v1/clips/initiate-upload",
        headers=headers,
        json={
            "duration_seconds": 4.0,
            "width_px": 1080,
            "height_px": 1920,
            "content_type": "video/quicktime",
            "size_bytes": max(len(MINIMAL_VIDEO_SNIFF_BYTES), 1),
            **extra,
        },
    )
    assert init.status_code == 201, init.text
    body = init.json()
    dest = Path(client.app.state.upload_dir) / body["storage_key"]
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(MINIMAL_VIDEO_SNIFF_BYTES)
    return body


def test_disabled_providers_complete_honestly_and_release_charge(
    client: TestClient, providers_off: None
) -> None:
    user_id, headers = _free_user(client, "providers-off@onflow.test")
    body = _initiate(client, headers, client_hint_trick_id="kickflip", stance="switch")
    clip_id = body["clip_id"]

    r = client.post(f"/api/v1/clips/{clip_id}/complete-upload", headers=headers)
    assert r.status_code == 200, r.text

    job = client.app.state.repo.get(clip_id)
    assert job is not None
    assert job.clip_metadata["tricks"] == ["kickflip"]
    assert job.clip_metadata["stance"] == "switch"

    terminal = wait_for_terminal_job(client, clip_id, headers)
    assert terminal["status"] == "completed", terminal
    result = terminal["result"]
    assert result["review_readiness"] == "insufficient"
    assert result["review_method"] == "provider_disabled"
    # No fabricated read: nothing a provider would have produced is present.
    assert result.get("landed") is None
    assert result.get("land_score") is None
    assert result.get("normalized_review") is None
    assert result.get("best_cue") is None
    assert not result["quality_signals"].get("mechanics_dimensions")

    job = client.app.state.repo.get(clip_id)
    assert job is not None
    assert job.quota_source == "monthly_refunded"
    assert client.app.state.repo.count_monthly_free_jobs(user_id) == 0


def test_health_reports_providers_disabled(client: TestClient, providers_off: None) -> None:
    body = client.get("/health").json()
    assert body["analysis_providers_enabled"] is False
    assert body["clip_review_ready"] is False


def test_unknown_stance_is_rejected(client: TestClient) -> None:
    _, headers = _free_user(client, "bad-stance@onflow.test")
    r = client.post(
        "/api/v1/clips/initiate-upload",
        headers=headers,
        json={
            "duration_seconds": 4.0,
            "width_px": 1080,
            "height_px": 1920,
            "content_type": "video/mp4",
            "size_bytes": 10,
            "stance": "Sideways",
        },
    )
    assert r.status_code == 422


def test_another_account_cannot_read_the_job(
    client: TestClient, providers_off: None
) -> None:
    _, owner = _free_user(client, "job-owner@onflow.test")
    _, intruder = _free_user(client, "job-intruder@onflow.test")
    clip_id = _initiate(client, owner)["clip_id"]
    assert client.post(f"/api/v1/clips/{clip_id}/complete-upload", headers=owner).status_code == 200
    wait_for_terminal_job(client, clip_id, owner)

    assert client.get(f"/api/v1/clips/jobs/{clip_id}", headers=intruder).status_code == 404
    assert (
        client.post(f"/api/v1/clips/{clip_id}/complete-upload", headers=intruder).status_code
        == 404
    )


def test_retry_after_failed_job_does_not_charge_twice(
    client: TestClient, monkeypatch: pytest.MonkeyPatch, providers_off: None
) -> None:
    from app.services import clip_worker

    calls = {"n": 0}

    def _flaky_first_pass(_path: str) -> dict[str, Any]:
        calls["n"] += 1
        if calls["n"] == 1:
            raise RuntimeError("transient worker failure")
        return {**READABLE_FIRST_PASS, "review_readiness": "usable"}

    monkeypatch.setattr(clip_worker, "analyze_video_first_pass", _flaky_first_pass)
    # Keep the uploaded object so the retry exercises re-enqueue, not re-upload.
    async def _keep(*_a: Any, **_k: Any) -> None:
        return None

    monkeypatch.setattr(clip_worker, "_cleanup_upload", _keep)

    user_id, headers = _free_user(client, "retry-once@onflow.test")
    clip_id = _initiate(client, headers)["clip_id"]
    assert client.post(f"/api/v1/clips/{clip_id}/complete-upload", headers=headers).status_code == 200
    failed = wait_for_terminal_job(client, clip_id, headers)
    assert failed["status"] == "failed", failed

    retry = client.post(f"/api/v1/clips/{clip_id}/complete-upload", headers=headers)
    assert retry.status_code == 200, retry.text
    done = wait_for_terminal_job(client, clip_id, headers)
    assert done["status"] == "completed", done
    # One clip, one job row, and no outstanding charge after the honest result.
    assert client.app.state.repo.count_monthly_free_jobs(user_id) == 0
