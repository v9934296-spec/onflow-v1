"""Validate and serialize skater personalization.

Client contract: docs/personalization-001-client.md.
P2: completion must not require age_range while AGE_STEP_ENABLED is false.
4xx ``detail`` is a bare code so the client can map it (prose is ignored).
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException

from app.models import SkaterProfileModel
from app.schemas.skater_profile import SkaterProfileOut, SkaterProfilePatchRequest

NATURAL_STANCES = frozenset({"regular", "goofy"})
SKATE_STYLES = frozenset({"street", "park", "vert"})
EXPERIENCE_LEVELS = frozenset({"beginner", "intermediate", "advanced"})
AGE_RANGES = frozenset({"under_13", "13_17", "18_24", "25_34", "35_44", "45_plus"})

PROFILE_LIMITS = {
    "city": 100,
    "home_park": 150,
    "brand": 60,
    "brands": 20,
    "styles": 3,
}

# Owner decision 2026-09-05: age step paused. Do not require age_range to complete.
REQUIRE_AGE_RANGE_FOR_COMPLETION = False


def _invalid() -> None:
    raise HTTPException(status_code=422, detail="profile_invalid")


def _incomplete() -> None:
    raise HTTPException(status_code=422, detail="profile_incomplete")


def _iso(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat().replace("+00:00", "Z")


def _optional_enum(raw: Any, allowed: frozenset[str]) -> str | None:
    if raw is None:
        return None
    if not isinstance(raw, str):
        _invalid()
    value = raw.strip()
    if not value:
        return None
    if value not in allowed:
        _invalid()
    return value


def _optional_text(raw: Any, max_len: int) -> str | None:
    if raw is None:
        return None
    if not isinstance(raw, str):
        _invalid()
    trimmed = raw.strip()
    if not trimmed:
        return None
    if len(trimmed) > max_len:
        _invalid()
    return trimmed


def _styles(raw: Any) -> list[str]:
    if raw is None:
        return []
    if not isinstance(raw, list):
        _invalid()
    out: list[str] = []
    for item in raw:
        if not isinstance(item, str) or item not in SKATE_STYLES:
            _invalid()
        if item in out:
            continue
        out.append(item)
        if len(out) > PROFILE_LIMITS["styles"]:
            _invalid()
    return out


def _brands(raw: Any) -> list[str]:
    if raw is None:
        return []
    if not isinstance(raw, list):
        _invalid()
    seen: set[str] = set()
    out: list[str] = []
    for item in raw:
        if not isinstance(item, str):
            _invalid()
        cleaned = item.strip()
        if not cleaned:
            continue
        if len(cleaned) > PROFILE_LIMITS["brand"]:
            _invalid()
        key = cleaned.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(cleaned)
        if len(out) > PROFILE_LIMITS["brands"]:
            _invalid()
    return out


@dataclass(frozen=True)
class ValidatedSkaterProfilePatch:
    natural_stance: str | None
    skate_styles: list[str]
    primary_skate_style: str | None
    experience_level: str | None
    age_range: str | None
    city: str | None
    home_park: str | None
    favorite_brands: list[str]
    complete_onboarding: bool


def validate_patch(req: SkaterProfilePatchRequest) -> ValidatedSkaterProfilePatch:
    complete = req.complete_onboarding
    if complete is None:
        complete = False
    if not isinstance(complete, bool):
        _invalid()

    styles = _styles(req.skate_styles)
    primary = _optional_enum(req.primary_skate_style, SKATE_STYLES)
    if primary is not None and primary not in styles:
        _invalid()

    patch = ValidatedSkaterProfilePatch(
        natural_stance=_optional_enum(req.natural_stance, NATURAL_STANCES),
        skate_styles=styles,
        primary_skate_style=primary,
        experience_level=_optional_enum(req.experience_level, EXPERIENCE_LEVELS),
        age_range=_optional_enum(req.age_range, AGE_RANGES),
        city=_optional_text(req.city, PROFILE_LIMITS["city"]),
        home_park=_optional_text(req.home_park, PROFILE_LIMITS["home_park"]),
        favorite_brands=_brands(req.favorite_brands),
        complete_onboarding=complete,
    )
    if complete:
        missing = (
            patch.natural_stance is None
            or not patch.skate_styles
            or patch.primary_skate_style is None
            or patch.experience_level is None
            or (REQUIRE_AGE_RANGE_FOR_COMPLETION and patch.age_range is None)
        )
        if missing:
            _incomplete()
    return patch


def to_out(row: SkaterProfileModel) -> SkaterProfileOut:
    return SkaterProfileOut(
        natural_stance=row.natural_stance,
        skate_styles=row.skate_styles,
        primary_skate_style=row.primary_skate_style,
        experience_level=row.experience_level,
        age_range=row.age_range,
        city=row.city,
        home_park=row.home_park,
        favorite_brands=row.favorite_brands,
        onboarding_completed_at=_iso(row.onboarding_completed_at),
    )


def analysis_context_line(row: SkaterProfileModel | None) -> str | None:
    """Allowlisted fields only. Never city, home park, or brands."""
    if row is None or row.onboarding_completed_at is None:
        return None
    parts: list[str] = []
    if row.natural_stance:
        parts.append(f"natural_stance={row.natural_stance}")
    styles = row.skate_styles
    if styles:
        parts.append(f"skate_styles={','.join(styles)}")
    if row.primary_skate_style:
        parts.append(f"primary_skate_style={row.primary_skate_style}")
    if row.experience_level:
        parts.append(f"experience_level={row.experience_level}")
    if not parts:
        return None
    return "skater_profile: " + "; ".join(parts)
