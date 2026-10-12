"""Clip History is authenticated, private, bounded, and does not expose storage credentials."""
from __future__ import annotations

from fastapi.testclient import TestClient


def test_clip_history_only_lists_current_users_clips(authed_client: TestClient) -> None:
    body = {
        "duration_seconds": 4.0,
        "width_px": 1080,
        "height_px": 1920,
        "content_type": "video/mp4",
        "size_bytes": 1024,
        "client_hint_trick_id": "kickflip",
        "stance": "switch",
    }
    created = authed_client.post("/api/v1/clips/initiate-upload", json=body)
    assert created.status_code == 201, created.text
    own_id = created.json()["clip_id"]

    history = authed_client.get("/api/v1/clips")
    assert history.status_code == 200, history.text
    entries = history.json()["clips"]
    assert any(clip["id"] == own_id and clip["trick_id"] == "kickflip" for clip in entries)
    assert all("storage_key" not in clip and "upload_url" not in clip for clip in entries)

    authed_client.app.state.db.ensure_invite_claim_user("other-history-user", "free")
    other = authed_client.get(
        "/api/v1/clips",
        headers={"Authorization": "Bearer dev:other-history-user"},
    )
    assert other.status_code == 200
    assert all(row["id"] != own_id for row in other.json()["clips"])


def test_clip_history_requires_auth_and_bounds_limit(client: TestClient) -> None:
    assert client.get("/api/v1/clips").status_code == 401
    assert client.get(
        "/api/v1/clips?limit=1000",
        headers={"Authorization": "Bearer dev:test-user-001"},
    ).status_code == 422
