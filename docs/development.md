# Development Guide

## Testing

```bash
npm test                 # Run all unit/integration tests (Vitest)
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
npm run test:e2e         # Run E2E smoke tests (requires deployed environment)
bash scripts/e2e.sh      # Fetch E2E config from Secrets Manager and run smoke tests
```

### Unit & integration tests (63 tests across 6 files)

| Area     | Test File                     | Coverage                                            |
| -------- | ----------------------------- | --------------------------------------------------- |
| Backend  | `handler.integration.test.ts` | Full request lifecycle (auth, routing, S3)          |
| Backend  | `routes/drafts.test.ts`       | Lock checks, snapshot building, subsystem logic     |
| Backend  | `routes/utils.test.ts`        | CORS, auth helpers, response formatting             |
| Frontend | `store/selectors.test.ts`     | Dirty detection, pending changes, catalog selectors |
| Frontend | `utils/diff.test.ts`          | Commit diff computation                             |
| Frontend | `utils/export.test.ts`        | Markdown/JSON export formatting                     |

### E2E smoke tests

`e2e/smoke.ts` authenticates via Cognito, then verifies frontend health, API availability, CORS headers, project listing, and catalog access against the live deployment.

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

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push to `main`:

1. **Quality gates** — Prettier, ESLint, Stylelint, TFLint, Terraform format check
2. **Security scans** — Trivy IaC misconfiguration scan + filesystem secret detection
3. **Type checking** — TypeScript compilation (frontend + backend)
4. **Unit tests** — Vitest (63 tests)
5. **Deploy** — `scripts/deploy.sh` (OIDC credentials, no long-lived keys)
6. **E2E smoke test** — Post-deploy verification against the live environment
