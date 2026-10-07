# OnFlow API (`services/api`)

FastAPI backend for the launch client in this repo. Copied from the working Onflow Demo tree, then extended with skater personalization (`GET`/`PATCH /api/v1/account/skater-profile`).

## Local run (Windows)

From this directory:

```powershell
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

`GET http://127.0.0.1:8000/health` should return 200.

Point the Expo client at that origin (repo-root `.env`):

```
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000
```

On a physical iPhone, use your machine's LAN IP instead of `127.0.0.1`, and set Cloudflare R2 (`ONFLOW_S3_*`) so initiate-upload is not a `local://` URL.

Empty `ONFLOW_JWT_SECRET` in development allows unsigned `dev:{user_id}` tokens and `POST /api/v1/auth/session`. Production/staging require JWT, Redis, and R2.

Without `ONFLOW_GEMINI_API_KEY`, clip jobs can complete as `provider_unavailable`. That is honest, not a fake review.

## Schema

Local SQLite creates tables on boot (`create_db_tables`). Production/staging skip that — Alembic owns schema:

```powershell
python -m alembic upgrade head
```

Latest personalization revision: `20260908_skater_profiles`.

## Tests

From repo root (matches CI):

```powershell
npm run api:test
```

From this directory:

```powershell
python -m pytest tests/test_skater_profile.py -q
python -m pytest tests -q
```

GitHub Actions runs `python -m pytest tests -q` on every push/PR (job `api`). Live Gemini (`test_gemini_integration.py`) and token regression (`tests/regression/`) skip unless you set `ONFLOW_GEMINI_API_KEY` / `GEMINI_REGRESSION_ENABLED=1`.

The full suite is large (OpenCV). Run a named file unless you mean to wait.

## Deploy

Railway reads `railway.toml` (API) and `railway.worker.toml` (ARQ worker) at the **repo root**. Pre-deploy runs `python3.12 -m alembic upgrade head`. Set env on both services; a repo `.env` does not change Railway.
