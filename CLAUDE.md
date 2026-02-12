# CLAUDE.md

## Project Overview

Stack Atlas is a multi-tenant web application for standardizing how teams describe their technology stacks. Users filter a curated catalog, select technologies, and export standardized stack definitions. Projects support subsystems (inheritance model), draft/commit workflows, and commit history.

## Architecture

```
Frontend (React SPA on CloudFront) → API Gateway HTTP API → Lambda (Node.js 24) → S3 (JSON data)
Authentication: Amazon Cognito (JWT)
```

## Repository Structure

```
stack-atlas/
├── frontend/          # React 18 + Vite SPA
│   └── src/
│       ├── App.jsx            # Main app (~1100 lines, all state management)
│       ├── api.js             # API client (all endpoints)
│       ├── auth.js            # Cognito auth helpers
│       ├── config.js          # Runtime config (window.__APP_CONFIG__ or env vars)
│       ├── components/        # Component-per-file with dedicated .css
│       ├── data/stackData.js  # Static catalog fallback
│       └── utils/             # search, tree, export, diff
├── backend/           # Lambda handler (esbuild → CJS)
│   └── src/
│       ├── handler.js         # Entry point, route dispatch
│       ├── auth.js            # JWT verification
│       ├── roles.js           # Admin/editor checks
│       ├── storage.js         # S3 data layer (read/write JSON)
│       └── routes/            # Modular route handlers
│           ├── projects.js    # CRUD + stack + view
│           ├── subsystems.js  # Subsystem CRUD
│           ├── drafts.js      # Draft save/load, commit
│           ├── admin.js       # Roles, catalog, users, locks
│           └── utils.js       # CORS, auth, response helpers
├── infrastructure/    # Terraform (AWS)
│   └── terraform/
│       ├── stack-atlas.tf     # Main resources
│       ├── locals.tf          # Config values
│       └── modules/           # api-http, cognito, spa-website
├── scripts/
│   └── deploy.sh              # Full deploy (build + terraform apply)
└── package.json               # Root scripts (dev, build, build:backend)
```

## Commands

```bash
npm run dev              # Start frontend dev server (Vite)
npm run build            # Build frontend (vite build)
npm run build:backend    # Build backend (esbuild → dist/handler.js)
./scripts/deploy.sh      # Full deploy (build + terraform apply)
```

**Never start the dev server in Claude Code sessions.**

## Key Patterns

### Component CSS
Each component has a dedicated `.css` file. Use `data-*` attributes for conditional styling (not CSS classes). Example: `data-active`, `data-selected`, `data-inherited`, `data-density`.

### State Management
All state lives in `App.jsx` via `useState`/`useMemo`/`useCallback`. No external state library. Key state groups:
- Selection: `selectedItems`, `selectedProviders`
- Filters: `query`, `selectedCategories`, `selectedTypes`, `selectedTags`
- Project: `activeProject`, `activeSubsystem`, `savedStack`, `savedProviders`
- Draft: `hasDraft`, `draftStatus`, `draftSubsystems`

### Auto-save
2-second debounce via `useEffect` + `setTimeout`. Uses `performAutoSaveRef` (ref pattern) to avoid infinite re-triggering from callback dependency changes. Only fires when `dirty` is true. The `skipAutoSave` ref prevents save during load/commit/discard operations.

### Draft/Commit Workflow
1. User edits items → `dirty` becomes true → auto-save creates draft after 2s
2. Draft stored in S3 at `drafts/{userSub}/{projectId}.json`
3. Commit promotes draft to committed state, creates snapshot in commit log
4. Drafts have per-user locks (30-minute expiry)

### Subsystem Inheritance
- Base system defines technologies (the project's committed stack)
- Subsystems inherit all base items and can add more
- Subsystem data: `{ name, additions[] }` — only stores delta from base
- Effective stack = base + additions

### Cloud Provider Filters
Exclusion-based: selecting AWS filters OUT items tagged `gcp`/`azure`, but keeps cloud-agnostic items. Provider selection persists with the project draft and commits.

### S3 Data Structure
```
projects/index.json                           # Project registry
projects/{id}/stack.json                      # Committed stack
projects/{id}/commits.json                    # Commit history
projects/{id}/subsystems/{subId}.json         # Subsystem definitions
drafts/{userSub}/{projectId}.json             # User drafts
config/roles.json                             # Admin/editor assignments
config/catalog.json                           # Published catalog
config/users.json                             # User registry
```

### CORS
Handled at two levels: API Gateway `cors_configuration` and Lambda `getCorsHeaders()`. Allowed origins defined in `locals.tf`. Both must be in sync.

### API Gateway Routes
Every backend endpoint must be registered as a route in `infrastructure/terraform/stack-atlas.tf` under the `routes` list. Missing routes cause CORS errors (request never reaches Lambda).

## Environment Variables

**Frontend** (via `window.__APP_CONFIG__` or `VITE_*`):
- `apiBaseUrl` / `VITE_API_BASE_URL`
- `cognitoUserPoolId` / `VITE_COGNITO_USER_POOL_ID`
- `cognitoClientId` / `VITE_COGNITO_CLIENT_ID`

**Backend Lambda**:
- `DATA_BUCKET` — S3 bucket for data storage
- `COGNITO_USER_POOL_ID` — Cognito pool for JWT verification
- `COGNITO_CLIENT_ID` — Cognito app client ID
- `ALLOWED_ORIGINS` — Comma-separated CORS origins

## Gotchas

- Backend builds to CJS (`--format=cjs`) despite using ESM in source — required for Lambda compatibility
- `global` must be polyfilled as `globalThis` in vite.config.js for amazon-cognito-identity-js
- The `dirty` useMemo must be defined before the auto-save useEffect that references it
- `performAutoSave` uses a ref pattern to prevent useEffect dependency cycling
- localStorage keys: `sa_activeProject`, `sa_activeSubsystem`
