"""ARQ builds Worker(**WorkerSettings.__dict__); every value must be concrete."""

from __future__ import annotations

import importlib

import pytest


def test_worker_redis_settings_is_concrete(monkeypatch: pytest.MonkeyPatch) -> None:
    from arq.connections import RedisSettings
    from arq.worker import get_kwargs

    monkeypatch.setenv("ONFLOW_REDIS_URL", "redis://redis.railway.internal:6379/0")
    from app.core.config import get_settings

    get_settings.cache_clear()
    import app.services.job_queue as job_queue

    try:
        job_queue = importlib.reload(job_queue)
        kwargs = get_kwargs(job_queue.WorkerSettings)
        assert isinstance(kwargs["redis_settings"], RedisSettings)
        assert kwargs["redis_settings"].host == "redis.railway.internal"
    finally:
        monkeypatch.delenv("ONFLOW_REDIS_URL", raising=False)
        get_settings.cache_clear()
        importlib.reload(job_queue)
