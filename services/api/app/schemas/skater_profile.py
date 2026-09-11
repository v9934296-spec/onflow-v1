"""Skater personalization wire shapes (PERSONALIZATION-001)."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class SkaterProfileOut(BaseModel):
    natural_stance: str | None = None
    skate_styles: list[str] = Field(default_factory=list)
    primary_skate_style: str | None = None
    experience_level: str | None = None
    age_range: str | None = None
    city: str | None = None
    home_park: str | None = None
    favorite_brands: list[str] = Field(default_factory=list)
    onboarding_completed_at: str | None = None


class SkaterProfilePatchRequest(BaseModel):
    """Loose body — enum/limit/completion rules live in ``app.services.skater_profile``."""

    model_config = ConfigDict(extra="ignore")

    natural_stance: Any = None
    skate_styles: Any = None
    primary_skate_style: Any = None
    experience_level: Any = None
    age_range: Any = None
    city: Any = None
    home_park: Any = None
    favorite_brands: Any = None
    complete_onboarding: Any = False
