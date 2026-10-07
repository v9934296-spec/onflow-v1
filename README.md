# OnFlow

Launch client (`com.onflow.lite`) and FastAPI backend in one tree.

- **Client:** Expo 53 / this repo root. `npm start`
- **API:** [`services/api`](services/api/README.md). `npm run api:dev` (port 8000)

Set `EXPO_PUBLIC_API_URL=http://127.0.0.1:8000` in `.env` (see `.env.example`). Product contract: [`onflow-product-build-spec (1).md`](onflow-product-build-spec%20(1).md).

**Verify before merge:** `npm run verify:all` (client phase-0 gate + API pytest). CI runs the same checks in parallel jobs. Dependabot opens weekly npm/pip update PRs.

### E2E smoke (Maestro, local)

No Detox setup in this repo. Minimal Maestro flow: launch with a clean app state and assert the sign-in screen (`com.onflow.lite`).

1. Install [Maestro](https://maestro.mobile.dev/docs/getting-started/installing-maestro).
2. Install an iOS Simulator build (e.g. `npm run build:preview:ios` via EAS, or run a local dev client with the same bundle ID).
3. `npm run e2e:smoke` (or `maestro test .maestro/smoke-sign-in.yaml`).

CI: optional manual run via **Actions → e2e-smoke** (`.github/workflows/e2e-smoke.yml`); wiring artifact install + `maestro test` is the next step once a stable preview build is published.
