# Architecture

## Project Structure

```
stack-atlas/
├── frontend/                  # React 19 SPA (TypeScript)
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
