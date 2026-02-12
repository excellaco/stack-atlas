# Stack Atlas

[![CI/CD](https://github.com/excellaco/stack-atlas/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/excellaco/stack-atlas/actions/workflows/ci.yml)

Unify how teams describe their technology stacks. Stack Atlas provides a curated catalog of technologies that teams filter, select, and export as standardized stack definitions for side-by-side comparison across programs.

## Features

- **Curated Catalog** — Browse technologies organized by category (compute, storage, networking, security, etc.) with search, type filters, and tag filtering
- **Cloud Provider Filtering** — Select AWS, Azure, or GCP to see provider-specific items alongside cloud-agnostic technologies. Provider affinity is expressed as tags on catalog items, keeping the data model flat
- **Hierarchy View** — Items with parent relationships display as indented trees (e.g. "Kubernetes" under "Container Orchestration"), with automatic parent inclusion when children match filters
- **Project Management** — Create projects to track team technology selections with full CRUD via admin panel
- **Subsystem Inheritance** — Define a base project stack, then create subsystems that inherit all base technologies. Subsystems store only their differences (additions and exclusions), so they stay in sync when the parent stack changes
- **Draft/Commit Workflow** — Git-like editing model with auto-saved drafts (2-second debounce), per-user locking (30-minute expiry), commit with messages, and full commit history with snapshot diffs
- **Export** — Copy stack output as Markdown or JSON
- **Read-Only View** — Shareable project view at `/view/:projectId/:subsystemId?`
- **Role-Based Access** — Admins (via Cognito groups) can manage everything; editors get per-project write access
- **Multi-Tenant** — Per-user draft locking, project-scoped editor permissions
- **Admin Panel** — Manage roles, publish the catalog, create/delete projects and subsystems, view active locks, and browse cross-project activity

## Tech Stack

| Layer    | Technology                                             |
| -------- | ------------------------------------------------------ |
| Frontend | React 18, TypeScript, Vite, Zustand, React Router      |
| Backend  | Node.js 24, TypeScript, AWS Lambda, esbuild            |
| Auth     | Amazon Cognito (JWT)                                   |
| Data     | Amazon S3 (JSON documents)                             |
| API      | API Gateway HTTP API                                   |
| CDN      | CloudFront + WAF                                       |
| DNS/TLS  | Route 53, ACM                                          |
| IaC      | Terraform                                              |
| CI/CD    | GitHub Actions (OIDC)                                  |
| Testing  | Vitest, E2E smoke tests                                |
| Linting  | ESLint, Prettier, Stylelint, SonarJS, jsx-a11y, TFLint |
| Security | Trivy (IaC misconfiguration + secret detection)        |

## Quick Start

### Prerequisites

- Node.js 24+
- npm
- AWS CLI (configured with credentials)
- Terraform 1.0+

### Local Development

```bash
# Install all dependencies
npm ci
npm ci --prefix frontend
npm ci --prefix backend

# Set frontend environment variables
cat > frontend/.env <<EOF
VITE_API_BASE_URL=https://api.stack-atlas.com
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxx
VITE_COGNITO_CLIENT_ID=xxxxx
EOF

# Start dev server
npm run dev
```

### Build

```bash
npm run build            # Frontend (outputs to frontend/dist/)
npm run build:backend    # Backend (outputs to backend/dist/handler.js)
```

### Deploy

```bash
bash scripts/deploy.sh
```

This script:

1. Checks prerequisites (aws, terraform, node, npm, jq)
2. Builds frontend and backend
3. Creates/configures the Terraform state bucket
4. Runs `terraform apply`
5. Outputs the site URL, API endpoint, and seed user credentials

## Testing

```bash
npm test                 # Run all unit/integration tests (Vitest)
npm run test:watch       # Run tests in watch mode
npm run test:e2e         # Run E2E smoke tests (requires deployed environment)
bash scripts/e2e.sh      # Fetch E2E config from Secrets Manager and run smoke tests
```

**Unit & integration tests** (63 tests across 6 files):

| Area     | Test File                     | Coverage                                            |
| -------- | ----------------------------- | --------------------------------------------------- |
| Backend  | `handler.integration.test.ts` | Full request lifecycle (auth, routing, S3)          |
| Backend  | `routes/drafts.test.ts`       | Lock checks, snapshot building, subsystem logic     |
| Backend  | `routes/utils.test.ts`        | CORS, auth helpers, response formatting             |
| Frontend | `store/selectors.test.ts`     | Dirty detection, pending changes, catalog selectors |
| Frontend | `utils/diff.test.ts`          | Commit diff computation                             |
| Frontend | `utils/export.test.ts`        | Markdown/JSON export formatting                     |

**E2E smoke tests** (`e2e/smoke.ts`): authenticates via Cognito, exercises project CRUD, stack operations, draft workflow, commit/discard, subsystem CRUD, and admin endpoints against the live deployment.

E2E credentials are stored in AWS Secrets Manager (populated by Terraform) — neither CI nor local developers need to set environment variables manually.

## Linting & Quality

```bash
npm run lint             # ESLint + Stylelint
npm run lint:fix         # Auto-fix ESLint + Stylelint issues
npm run format           # Format all files (Prettier)
npm run format:check     # Verify formatting without changes
npm run typecheck        # TypeScript type checking (frontend + backend)
npm run lint:tf          # Terraform linting (TFLint)
npm run fmt:tf           # Format Terraform files
npm run fmt:tf:check     # Verify Terraform formatting
npm run security         # Trivy IaC + secret scanning
```

## CI Pipeline

The GitHub Actions workflow (`.github/workflows/deploy.yml`) runs on push to `main`:

1. **Quality gates** — Prettier, ESLint, Stylelint, TFLint, Terraform format check
2. **Security scans** — Trivy IaC misconfiguration scan + filesystem secret detection
3. **Type checking** — TypeScript compilation (frontend + backend)
4. **Unit tests** — Vitest (63 tests)
5. **Deploy** — `scripts/deploy.sh` (OIDC credentials, no long-lived keys)
6. **E2E smoke test** — Post-deploy verification against the live environment

## Project Structure

```
stack-atlas/
├── frontend/                  # React 18 SPA (TypeScript)
│   └── src/
│       ├── main.tsx           # Entry point, routes, bootstrap
│       ├── api.ts             # API client (typed wrappers around fetch)
│       ├── auth.ts            # Cognito authentication helpers
│       ├── config.ts          # Runtime config (window.__APP_CONFIG__ or env vars)
│       ├── types.ts           # Domain model type definitions
│       ├── store/             # Zustand store (5 slices, selectors, subscriptions)
│       ├── hooks/             # useEditorState (filtering, inheritance, URL sync)
│       ├── components/        # Component-per-file with dedicated .css
│       ├── data/              # Static catalog data (stackData.ts)
│       └── utils/             # search, tree, export, diff
├── backend/                   # Lambda API handler (TypeScript → esbuild → CJS)
│   └── src/
│       ├── handler.ts         # Entry point, route dispatch
│       ├── auth.ts            # JWT verification (ID token)
│       ├── roles.ts           # Admin/editor authorization
│       ├── storage.ts         # S3 data layer (JSON documents)
│       └── routes/            # Modular route handlers
│           ├── projects.ts    # CRUD + stack + view
│           ├── subsystems.ts  # Subsystem CRUD
│           ├── drafts.ts      # Draft save/load, commit, locking
│           ├── admin.ts       # Roles, catalog, users, locks, activity
│           └── utils.ts       # CORS, auth, response helpers
├── e2e/                       # E2E smoke tests
│   └── smoke.ts               # Post-deploy verification
├── infrastructure/            # Terraform (AWS)
│   └── terraform/
│       ├── stack-atlas.tf     # Data bucket, Lambda, API Gateway routes
│       ├── identity.tf        # Cognito users and groups
│       ├── github-actions.tf  # OIDC deploy role + IAM policies
│       ├── e2e.tf             # Secrets Manager for E2E config
│       ├── locals.tf          # Config values (domains, names)
│       ├── outputs.tf         # Terraform outputs
│       └── modules/
│           ├── api-http/      # API Gateway + Lambda integration
│           ├── cognito/       # User pool, clients, custom domain
│           └── spa-website/   # S3 + CloudFront + ACM + Route 53 + WAF
├── scripts/
│   ├── deploy.sh              # Full deploy (build + terraform apply)
│   └── e2e.sh                 # Fetch secrets and run E2E tests locally
├── eslint.config.mjs          # ESLint flat config (TS, React, a11y, SonarJS)
├── vitest.config.ts           # Test configuration
└── package.json               # Root scripts and dev dependencies
```

## API Endpoints

### Projects

| Method | Path                  | Auth   | Description            |
| ------ | --------------------- | ------ | ---------------------- |
| GET    | `/projects`           | Yes    | List all projects      |
| POST   | `/projects`           | Admin  | Create project         |
| PUT    | `/projects/:id`       | Admin  | Update project         |
| DELETE | `/projects/:id`       | Admin  | Delete project         |
| GET    | `/projects/:id/stack` | Yes    | Get committed stack    |
| PUT    | `/projects/:id/stack` | Editor | Update stack           |
| GET    | `/projects/:id/view`  | Yes    | Read-only project view |

### Subsystems

| Method | Path                              | Auth   | Description      |
| ------ | --------------------------------- | ------ | ---------------- |
| GET    | `/projects/:id/subsystems`        | Yes    | List subsystems  |
| POST   | `/projects/:id/subsystems`        | Editor | Create subsystem |
| PUT    | `/projects/:id/subsystems/:subId` | Editor | Update subsystem |
| DELETE | `/projects/:id/subsystems/:subId` | Editor | Delete subsystem |

### Drafts & Commits

| Method | Path                    | Auth   | Description        |
| ------ | ----------------------- | ------ | ------------------ |
| GET    | `/projects/:id/draft`   | Editor | Get current draft  |
| PUT    | `/projects/:id/draft`   | Editor | Save draft         |
| DELETE | `/projects/:id/draft`   | Editor | Discard draft      |
| POST   | `/projects/:id/commit`  | Editor | Commit draft       |
| GET    | `/projects/:id/commits` | Yes    | Get commit history |

### Admin

| Method | Path                               | Auth  | Description             |
| ------ | ---------------------------------- | ----- | ----------------------- |
| GET    | `/admin/roles`                     | Admin | Get role assignments    |
| PUT    | `/admin/roles`                     | Admin | Update roles            |
| GET    | `/admin/users`                     | Admin | List registered users   |
| GET    | `/admin/locks`                     | Admin | List active draft locks |
| DELETE | `/admin/locks/:projectId/:userSub` | Admin | Break a lock            |
| GET    | `/admin/activity`                  | Admin | Get recent activity     |
| GET    | `/catalog`                         | Yes   | Get catalog             |
| PUT    | `/admin/catalog`                   | Admin | Publish catalog         |

## Configuration

### Frontend

Runtime configuration is loaded from `window.__APP_CONFIG__` (injected by Terraform into `config.js` on S3) with fallback to Vite environment variables:

| Config Key          | Env Variable                | Description           |
| ------------------- | --------------------------- | --------------------- |
| `apiBaseUrl`        | `VITE_API_BASE_URL`         | Backend API URL       |
| `cognitoUserPoolId` | `VITE_COGNITO_USER_POOL_ID` | Cognito User Pool ID  |
| `cognitoClientId`   | `VITE_COGNITO_CLIENT_ID`    | Cognito App Client ID |

### Backend (Lambda Environment)

| Variable               | Description                  |
| ---------------------- | ---------------------------- |
| `DATA_BUCKET`          | S3 bucket for data storage   |
| `COGNITO_USER_POOL_ID` | Cognito User Pool ID         |
| `COGNITO_CLIENT_ID`    | Cognito App Client ID        |
| `ALLOWED_ORIGINS`      | Comma-separated CORS origins |

## License

MIT License. See [LICENSE](LICENSE) for details.
