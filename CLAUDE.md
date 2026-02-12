# CLAUDE.md

## CRITICAL: No Destructive Git Commands

**NEVER run destructive git commands** including but not limited to:
- `git reset` (soft, mixed, or hard)
- `git checkout .` or `git checkout -- <file>` (discards uncommitted work)
- `git restore .` (discards uncommitted work)
- `git clean -f` (deletes untracked files)
- `git push --force` / `git push --force-with-lease`
- `git branch -D` (force-deletes branches)
- `git stash drop` / `git stash clear`

If you need to undo something, ask the user first. There is always parallel work in progress that these commands would destroy.

## Project Overview

Stack Atlas is a multi-tenant web application for standardizing how teams describe their technology stacks. Users filter a curated catalog, select technologies, and export standardized stack definitions. Projects support subsystems (additions/exclusions inheritance model), draft/commit workflows with per-user locking, and full commit history with snapshot diffs.

The entire codebase is **TypeScript** — frontend (.ts/.tsx), backend (.ts), tests (.ts), and E2E (.ts). There are no .js/.jsx source files.

## Architecture

```
Frontend (React 18 SPA on CloudFront + WAF) → API Gateway HTTP API → Lambda (Node.js 24) → S3 (JSON data)
Authentication: Amazon Cognito (JWT ID tokens — not access tokens, because ID tokens carry email + groups claims)
```

## Repository Structure

```
stack-atlas/
├── frontend/          # React 18 + Vite + Zustand SPA
│   └── src/
│       ├── main.tsx           # Entry point, route definitions, bootstrap
│       ├── api.ts             # API client (typed wrappers around fetch)
│       ├── auth.ts            # Cognito auth helpers (sign in/out, session, token refresh)
│       ├── config.ts          # Runtime config (window.__APP_CONFIG__ → Vite env → empty)
│       ├── types.ts           # Full domain model (catalog, project, subsystem, draft, commit)
│       ├── store/             # Zustand store (5 slices, selectors, subscriptions)
│       ├── hooks/             # useEditorState (filtering pipeline, inheritance, URL sync)
│       ├── components/        # Component-per-file with dedicated .css
│       ├── data/stackData.ts  # Static catalog fallback (~4000 lines, excluded from lint)
│       └── utils/             # search, tree, export, diff
├── backend/           # Lambda handler (esbuild → CJS for Lambda compatibility)
│   └── src/
│       ├── handler.ts         # Entry point, route dispatch (null = no match pattern)
│       ├── auth.ts            # JWT verification via aws-jwt-verify
│       ├── roles.ts           # Admin/editor checks (dual source: Cognito groups + roles.json)
│       ├── storage.ts         # S3 data layer (JSON documents, no database)
│       └── routes/            # Modular route handlers
│           ├── projects.ts    # Project CRUD + stack + view
│           ├── subsystems.ts  # Subsystem CRUD
│           ├── drafts.ts      # Draft save/load, commit, locking
│           ├── admin.ts       # Roles, catalog, users, locks, activity
│           └── utils.ts       # CORS, auth guards, response helpers
├── e2e/               # E2E smoke tests
│   └── smoke.ts               # Post-deploy verification against live environment
├── infrastructure/    # Terraform (AWS)
│   └── terraform/
│       ├── stack-atlas.tf     # Data bucket, Lambda, API Gateway routes
│       ├── identity.tf        # Cognito users/groups (including E2E test user)
│       ├── github-actions.tf  # OIDC deploy role + IAM policies
│       ├── e2e.tf             # Secrets Manager for E2E config
│       ├── locals.tf          # Config values (domains, names, CORS origins)
│       ├── outputs.tf         # Terraform outputs
│       └── modules/
│           ├── api-http/      # API Gateway HTTP + Lambda integration
│           ├── cognito/       # User pool, clients, custom domain
│           └── spa-website/   # S3 + CloudFront + ACM + Route 53 + WAF
├── scripts/
│   ├── deploy.sh              # Full deploy (build + terraform apply)
│   └── e2e.sh                 # Fetch secrets and run E2E tests locally
├── eslint.config.mjs          # ESLint flat config (TS, React, a11y, SonarJS)
├── vitest.config.ts           # Test config (node environment, no browser/jsdom)
└── package.json               # Root scripts, all dev dependencies
```

## Commands

```bash
# Development
npm run dev              # Start frontend dev server (Vite)
npm run build            # Build frontend (vite build → frontend/dist/)
npm run build:backend    # Build backend (esbuild → backend/dist/handler.js)

# Quality
npm run lint             # ESLint + Stylelint
npm run lint:fix         # Auto-fix ESLint + Stylelint issues
npm run lint:css         # Stylelint only
npm run format           # Format all files (Prettier)
npm run format:check     # Verify formatting without changes
npm run typecheck        # TypeScript type checking (frontend + backend)

# Testing
npm test                 # Run all unit/integration tests (Vitest, 63 tests)
npm run test:watch       # Run tests in watch mode
npm run test:e2e         # Run E2E smoke tests (requires env vars or scripts/e2e.sh)
bash scripts/e2e.sh      # Fetch E2E config from Secrets Manager and run smoke tests

# Infrastructure
npm run lint:tf          # Terraform linting (TFLint)
npm run fmt:tf           # Format Terraform files
npm run fmt:tf:check     # Verify Terraform formatting
npm run security         # Trivy IaC + secret scanning
bash scripts/deploy.sh   # Full deploy (build + terraform apply)
```

**Never start the dev server in Claude Code sessions.**

## Key Patterns

### Two Layout Shells

The app has two separate top-level route layouts (see main.tsx):

1. **Root** (top bar + sidebar + content) — landing page at `/`, read-only project view at `/view/:projectId/:subsystemId?`
2. **Editor** (full-screen 3-column grid: filters | catalog | selection) — editing at `/edit/:projectId/:subsystemId?`, sandbox at `/sandbox`

These are separate routes (not nested) because the Editor's 3-column grid is incompatible with Root's sidebar+content layout. Both share state through the Zustand store.

### Component CSS

Each component has a dedicated `.css` file. Use `data-*` attributes for conditional styling (not CSS classes). Example: `data-active`, `data-selected`, `data-inherited`, `data-density`, `data-depth`.

### State Management

Zustand store in `frontend/src/store/` with 5 slices:

- **authSlice** — user, token, session restore from Cognito localStorage cache, 10-min token refresh, sign in/out
- **catalogSlice** — dual-source: static bundled data (instant render) replaced by API-published catalog when available
- **projectSlice** — projects, subsystems, stack loading, localStorage persistence (sa_activeProject, sa_activeSubsystem)
- **draftSlice** — selection, auto-save (2s debounce), commit, discard, `_skipAutoSave` flag
- **uiSlice** — filters, search, view mode, density, export format, confirm dialogs

Selectors in `selectors.ts` are plain functions (not hooks) for testability. Subscriptions in `subscriptions.ts` fire outside React's render cycle (token change → load catalog/projects, selection change → auto-save). Components read from store directly via `useStore()`.

### Auto-save Flow

1. User toggles items → `selectedItems` changes in the store
2. Subscription in `subscriptions.ts` fires (reference equality check + `selectDirty`)
3. `scheduleAutoSave()` debounces 2 seconds
4. `performAutoSave()` writes draft to API
5. `lastSavedItems` updated to match

The `_skipAutoSave` flag prevents auto-save during operations that change `selectedItems` programmatically (loading a project, switching subsystems, discarding). Without it, the subscription would save stale intermediate state.

### Draft/Commit Workflow

1. User edits items → dirty → auto-save creates draft after 2s
2. Draft stored in S3 at `drafts/{userSub}/{projectId}.json` with a per-user lock (30-minute expiry)
3. Commit: flush pending auto-save → API commit → creates snapshot in commit log → refresh from server
4. Each commit stores a full snapshot (items, providers, subsystems) so any two commits can be diffed without reconstructing state from deltas

### Subsystem Inheritance

Subsystems use an **additions/exclusions** model, not full item lists:

- Parent project defines the committed stack (items + providers)
- Subsystems store only `{ name, additions[], exclusions[] }` — deltas from the parent
- Effective stack = parent items − exclusions + additions (`applySubsystemOverlay()`)
- If the parent project adds "Docker", all subsystems that haven't excluded it automatically include it
- In the UI, inherited items (from parent, not excluded) show an "inherited" badge

### Cloud Provider Filtering

Cloud provider affinity is expressed as **tags** on catalog items ("aws", "azure", "gcp"), not a separate field. The filtering logic (in `useEditorState.ts`):

- Items tagged with a provider are cloud-specific → must match at least one selected provider filter
- Items with NO provider tags are cloud-agnostic → always pass the provider filter
- This means selecting "AWS" shows all AWS-tagged items plus all cloud-agnostic items (e.g. Git, Docker)
- The `PROVIDER_IDS` constant in `useEditorState.ts` and the `PROVIDERS` list in `FilterPanel.tsx` must stay in sync

### Hierarchy View

Items can declare parent relationships via their `parents[]` array. In hierarchy view mode:

- `buildTree()` in `utils/tree.ts` builds a forest from the flat item list within each category
- Only the first matching parent present in the filtered set is used (items can have multiple parents)
- `flattenTree()` produces a flat array with depth info → rendered with CSS indentation via `data-depth`
- When filtering, if a child matches, its parent is auto-included so the tree isn't broken

### API Client Pattern

`frontend/src/api.ts` has a central `request<T>()` function:

- Bearer token in Authorization header
- 401 → triggers `authErrorHandler` callback → sets `sessionExpired` overlay
- Response unwrapping: `result.data ?? result` (backend returns `{ data: T }` for lists, `T` for singles)
- 204 → returns null (DELETE endpoints)
- All endpoints are thin typed wrappers around `request()`

### S3 Data Structure

```
projects/index.json                           # Project registry
projects/{id}/stack.json                      # Committed stack (items + providers)
projects/{id}/commits.json                    # Commit history (full snapshots)
projects/{id}/subsystems/{subId}.json         # Subsystem definitions (additions/exclusions)
drafts/{userSub}/{projectId}.json             # User drafts (locked per-user, 30-min expiry)
config/roles.json                             # Admin/editor role assignments
config/catalog.json                           # Published catalog (admin-uploaded)
config/users.json                             # User registry (deduped within Lambda invocation)
```

### CORS

Handled at two levels: API Gateway `cors_configuration` and Lambda `getCorsHeaders()`. Allowed origins defined in `locals.tf`. Both must be in sync.

### API Gateway Routes

Every backend endpoint must be registered as a route in `infrastructure/terraform/stack-atlas.tf` under the `routes` list. Missing routes cause CORS errors (request never reaches Lambda).

### Runtime Config Injection

Terraform writes `config.js` to the S3 website bucket with `window.__APP_CONFIG__` containing the API URL, Cognito pool ID, and client ID. This avoids build-time environment coupling — the same frontend build works for any environment.

### Backend Build

Backend builds to **CJS** (`--format=cjs`) despite using ESM in source — this is required for Lambda compatibility. The `global` must be polyfilled as `globalThis` in `vite.config.ts` for amazon-cognito-identity-js on the frontend.

## Testing

### Unit & Integration Tests (Vitest)

6 test files, 63 tests total. Node environment only — no component/rendering tests. Tests cover pure functions and handler-level integration:

| File | What it tests |
| --- | --- |
| `backend/src/handler.integration.test.ts` | Full request lifecycle. Mocks only storage.ts (S3) and auth.ts (JWT); everything else runs for real |
| `backend/src/routes/drafts.test.ts` | Lock checks, snapshot building, subsystem overlay logic |
| `backend/src/routes/utils.test.ts` | CORS headers, auth guards, response formatting |
| `frontend/src/store/selectors.test.ts` | Dirty detection, pending changes, catalog item selectors |
| `frontend/src/utils/diff.test.ts` | Commit diff computation |
| `frontend/src/utils/export.test.ts` | Markdown/JSON export formatting |

### E2E Smoke Tests

`e2e/smoke.ts` runs against the live deployment after deploy. It authenticates via Cognito and exercises project CRUD, stack operations, draft workflow, commit/discard, subsystem CRUD, and admin endpoints.

E2E credentials are stored in AWS Secrets Manager (populated by Terraform in `e2e.tf`). The CI workflow and `scripts/e2e.sh` both fetch from the same secret — no manual env var management.

## Linting & Formatting

| Tool | Config | Scope |
| --- | --- | --- |
| ESLint | `eslint.config.mjs` | TypeScript, React, accessibility (jsx-a11y), code quality (SonarJS) |
| Prettier | `.prettierrc` | Code formatting (double quotes, semicolons, 100-char width) |
| Stylelint | `.stylelintrc.json` | CSS linting (standard config) |
| TFLint | (via `npm run lint:tf`) | Terraform linting |
| Trivy | (via `npm run security`) | IaC misconfiguration + secret detection |

ESLint notable rules: complexity warn at 10, max-lines warn at 300, max-lines-per-function warn at 50, max-depth warn at 4. `data/stackData.ts` is excluded from linting (auto-generated, ~4000 lines).

## CI/CD Pipeline

Single GitHub Actions workflow (`.github/workflows/ci.yml`) with two jobs:

**`ci` job** — runs on push to **all branches** + PRs to main:

1. **Lint** — Prettier, ESLint, Stylelint, Terraform fmt, TFLint
2. **Security scans** — Trivy IaC config scan + filesystem secret detection (HIGH/CRITICAL, fail pipeline)
3. **Type checking** — `tsc --noEmit` for frontend and backend
4. **Unit tests** — Vitest (63 tests)

**`deploy` job** — runs on push to **main only**, `needs: ci` (won't run if CI fails):

5. **Deploy** — OIDC credentials → `scripts/deploy.sh`
6. **E2E smoke test** — Fetch credentials from Secrets Manager → run against live deployment

## Gotchas

- Backend builds to CJS (`--format=cjs`) despite using ESM in source — required for Lambda
- `global` must be polyfilled as `globalThis` in `vite.config.ts` for amazon-cognito-identity-js
- localStorage keys: `sa_activeProject`, `sa_activeSubsystem` — persisted across page refresh
- `data/stackData.ts` is excluded from ESLint — it's ~4000 lines of auto-generated catalog data
- Every API endpoint needs a matching route in `stack-atlas.tf` `routes` list or it gets CORS errors
- IAM policies in `github-actions.tf` are intentionally verbose (per-action, no wildcards)
- Cognito admin source is dual: Cognito groups for auth + `roles.json` in S3 for role management UI
- The E2E test user in `identity.tf` is admin so smoke tests can exercise all authenticated routes
