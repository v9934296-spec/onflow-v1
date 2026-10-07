# OnFlow

Launch client (`com.onflow.lite`) and FastAPI backend in one tree.

- **Client:** Expo 53 / this repo root. `npm start`
- **API:** [`services/api`](services/api/README.md). `npm run api:dev` (port 8000)

Set `EXPO_PUBLIC_API_URL=http://127.0.0.1:8000` in `.env` (see `.env.example`). Product contract: [`onflow-product-build-spec (1).md`](onflow-product-build-spec%20(1).md).

**Verify before merge:** `npm run verify:all` (client phase-0 gate + API pytest). CI runs the same checks in parallel jobs. Dependabot opens weekly npm/pip update PRs.
