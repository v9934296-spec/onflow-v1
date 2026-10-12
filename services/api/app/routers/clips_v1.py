"""V1 clip upload endpoints (contracts §4) — separate from legacy /clips/jobs."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel import Session, select

from app.core.auth import get_current_user
from app.core.database import get_db
from app.core.feature_gates import tier_has_feature
from app.core.tiers import normalize_tier
from app.core.rate_limit import (
    clip_abuse_limit_per_day,
    clip_abuse_limit_per_hour,
    clip_submission_key,
    limiter,
)
from app.models import ClipModel, SkateSessionModel
from app.schemas.clips import (
    ClipCompleteUploadResponse,
    ClipInitiateUploadRequest,
    ClipInitiateUploadResponse,
    ClipHistoryItem,
    ClipHistoryList,
)
from app.services.clip_upload import as_utc, clip_storage_key, iso_z, new_clip_id, presigned_put_url
from app.services.clip_v1_pipeline import assert_session_accepts_clip, complete_v1_clip_upload
from app.services.gemini_spend_cap import check_daily_spend_cap
from app.services.usage_limits import check_analysis_quota

router = APIRouter(prefix="/api/v1/clips", tags=["clips-v1"])

_TRIAL_ENDED_UPLOAD_MESSAGE = (
    "Your free trial has ended. Subscribe to Pro or grab a Re-Up pack to keep uploading clips."
)


def _require_upload_feature(request: Request, user_id: str) -> None:
    db = request.app.state.db
    tier = normalize_tier(db.get_user_tier(user_id))
    if not tier_has_feature(tier, "upload_clip"):
        raise HTTPException(status_code=403, detail="tier_gate")


def _resolve_session_for_upload(
    db: Session,
    user_id: str,
    session_id: str | None,
    *,
    captured_at: datetime | None = None,
) -> str | None:
    """Validate optional session_id; 404 if missing/deleted, 403 if another user's."""
    if session_id is None:
        return None
    row = db.get(SkateSessionModel, session_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Session not found.")
    if row.user_id != user_id:
        raise HTTPException(status_code=403, detail="Session not accessible.")
    assert_session_accepts_clip(row, captured_at=captured_at)
    return session_id



@router.get("", response_model=ClipHistoryList)
def list_my_clips(
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=100),
) -> ClipHistoryList:
    """Recent account-owned clips, including after reinstall; no storage keys leaked."""
    clips = db.exec(
        select(ClipModel)
        .where(ClipModel.user_id == user_id, ClipModel.deleted_at.is_(None))
        .order_by(ClipModel.created_at.desc())
        .limit(limit)
    ).all()
    return ClipHistoryList(
        clips=[
            ClipHistoryItem(
                id=clip.id,
                session_id=clip.session_id,
                trick_id=clip.trick_id,
                stance=clip.stance,
                upload_status=clip.upload_status,
                duration_seconds=clip.duration_seconds,
                created_at=iso_z(clip.created_at),
            )
            for clip in clips
        ]
    )


@router.post("/initiate-upload", status_code=201, response_model=ClipInitiateUploadResponse)
@limiter.limit(clip_abuse_limit_per_day, key_func=clip_submission_key)
@limiter.limit(clip_abuse_limit_per_hour, key_func=clip_submission_key)
def initiate_clip_upload(
    body: ClipInitiateUploadRequest,
    request: Request,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ClipInitiateUploadResponse:
    _require_upload_feature(request, user_id)
    # Non-consuming early gates only (abuse caps + Gemini spend cap). The product
    # quota (monthly free / bonus) is *charged* at complete-upload, so abandoned
    # uploads never burn a free slot or a bonus credit. Mirrors the legacy path's
    # early check_analysis_quota/check_daily_spend_cap before reserve-at-create.
    check_analysis_quota(user_id)
    check_daily_spend_cap()
    validated_session_id = _resolve_session_for_upload(
        db, user_id, body.session_id, captured_at=body.captured_at
    )

    clip_id = new_clip_id()
    storage_key = clip_storage_key(user_id, clip_id, body.content_type)
    storage = request.app.state.storage
    upload_url, expires_at = presigned_put_url(
        storage,
        storage_key,
        body.content_type,
    )

    now = datetime.now(timezone.utc)
    captured_at = as_utc(body.captured_at) if body.captured_at is not None else None
    clip = ClipModel(
        id=clip_id,
        user_id=user_id,
        session_id=validated_session_id,
        trick_id=body.client_hint_trick_id,
        stance=body.stance,
        storage_key=storage_key,
        storage_url="",
        duration_seconds=body.duration_seconds,
        width_px=body.width_px,
        height_px=body.height_px,
        content_type=body.content_type,
        size_bytes=body.size_bytes,
        upload_status="pending",
        created_at=now,
        updated_at=now,
        captured_at=captured_at,
    )
    db.add(clip)
    db.commit()

    return ClipInitiateUploadResponse(
        clip_id=clip_id,
        upload_url=upload_url,
        upload_expires_at=iso_z(expires_at),
        storage_key=storage_key,
    )



@router.post(
    "/{clip_id}/refresh-upload",
    response_model=ClipInitiateUploadResponse,
)
@limiter.limit(clip_abuse_limit_per_day, key_func=clip_submission_key)
@limiter.limit(clip_abuse_limit_per_hour, key_func=clip_submission_key)
def refresh_clip_upload(
    clip_id: str,
    request: Request,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ClipInitiateUploadResponse:
    """Renew an upload URL for the original uncompleted clip (no new clip or charge).

    Presigned URL expiry and failed PUTs must not create duplicate records. Only
    the clip owner may renew; after completion the object must not be overwritten.
    """
    clip = db.get(ClipModel, clip_id)
    if clip is None or clip.user_id != user_id or clip.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Clip not found.")
    if clip.upload_status != "pending":
        raise HTTPException(status_code=409, detail="Clip upload already completed.")
    if not clip.storage_key or not clip.content_type:
        raise HTTPException(status_code=409, detail="Clip upload metadata unavailable.")

    upload_url, expires_at = presigned_put_url(
        request.app.state.storage, clip.storage_key, clip.content_type
    )
    return ClipInitiateUploadResponse(
        clip_id=clip.id,
        upload_url=upload_url,
        upload_expires_at=iso_z(expires_at),
        storage_key=clip.storage_key,
    )


@router.post(
    "/{clip_id}/complete-upload",
    response_model=ClipCompleteUploadResponse,
)
@limiter.limit(clip_abuse_limit_per_day, key_func=clip_submission_key)
@limiter.limit(clip_abuse_limit_per_hour, key_func=clip_submission_key)
async def complete_clip_upload(
    clip_id: str,
    request: Request,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ClipCompleteUploadResponse:
    return await complete_v1_clip_upload(request, clip_id, user_id, db)
