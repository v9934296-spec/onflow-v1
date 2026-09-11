"""PERSONALIZATION-001 — skater profile GET/PATCH, export, deletion."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.core.database import get_engine
from app.models import SkaterProfileModel
from sqlmodel import Session

COMPLETE_BODY = {
    "natural_stance": "goofy",
    "skate_styles": ["street", "park"],
    "primary_skate_style": "street",
    "experience_level": "intermediate",
    "age_range": None,
    "city": "Oakland",
    "home_park": "Lake Merritt",
    "favorite_brands": ["Independent", "Spitfire"],
    "complete_onboarding": True,
}


def test_get_skater_profile_is_null_before_row(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    r = client.get("/api/v1/account/skater-profile", headers=auth_headers)
    assert r.status_code == 200, r.text
    assert r.json() is None


def test_patch_incomplete_then_complete_without_age(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    draft = {
        "natural_stance": "regular",
        "skate_styles": ["vert"],
        "primary_skate_style": "vert",
        "experience_level": None,
        "age_range": None,
        "city": None,
        "home_park": None,
        "favorite_brands": [],
    }
    r = client.patch("/api/v1/account/skater-profile", json=draft, headers=auth_headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["natural_stance"] == "regular"
    assert body["onboarding_completed_at"] is None

    r = client.patch(
        "/api/v1/account/skater-profile", json=COMPLETE_BODY, headers=auth_headers
    )
    assert r.status_code == 200, r.text
    completed = r.json()
    assert completed["onboarding_completed_at"]
    assert completed["age_range"] is None
    first_stamp = completed["onboarding_completed_at"]

    r = client.patch(
        "/api/v1/account/skater-profile", json=COMPLETE_BODY, headers=auth_headers
    )
    assert r.status_code == 200, r.text
    assert r.json()["onboarding_completed_at"] == first_stamp

    r = client.get("/api/v1/account/skater-profile", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["onboarding_completed_at"] == first_stamp


def test_complete_without_required_fields_is_profile_incomplete(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    r = client.patch(
        "/api/v1/account/skater-profile",
        json={**COMPLETE_BODY, "experience_level": None},
        headers=auth_headers,
    )
    assert r.status_code == 422
    assert r.json()["detail"] == "profile_incomplete"


def test_invalid_enum_and_primary_not_in_styles(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    r = client.patch(
        "/api/v1/account/skater-profile",
        json={**COMPLETE_BODY, "natural_stance": "mongo"},
        headers=auth_headers,
    )
    assert r.status_code == 422
    assert r.json()["detail"] == "profile_invalid"

    r = client.patch(
        "/api/v1/account/skater-profile",
        json={
            **COMPLETE_BODY,
            "skate_styles": ["street"],
            "primary_skate_style": "park",
        },
        headers=auth_headers,
    )
    assert r.status_code == 422
    assert r.json()["detail"] == "profile_invalid"


def test_limits_reject_oversized_city(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    r = client.patch(
        "/api/v1/account/skater-profile",
        json={**COMPLETE_BODY, "city": "x" * 101, "complete_onboarding": False},
        headers=auth_headers,
    )
    assert r.status_code == 422
    assert r.json()["detail"] == "profile_invalid"


def test_export_and_delete_include_profile(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    me = client.get("/api/v1/account/me", headers=auth_headers)
    assert me.status_code == 200
    user_id = me.json()["user_id"]

    r = client.patch(
        "/api/v1/account/skater-profile", json=COMPLETE_BODY, headers=auth_headers
    )
    assert r.status_code == 200, r.text

    exported = client.get("/api/v1/account/export", headers=auth_headers)
    assert exported.status_code == 200, exported.text
    profile = exported.json()["skater_profile"]
    assert profile["natural_stance"] == "goofy"
    assert profile["onboarding_completed_at"]

    deleted = client.delete("/api/v1/account", headers=auth_headers)
    assert deleted.status_code == 202

    with Session(get_engine()) as session:
        assert session.get(SkaterProfileModel, user_id) is None
