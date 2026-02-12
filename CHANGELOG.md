# Changelog

## 1.0.0

### Added

- **TypeScript migration** — Full codebase converted from JavaScript to TypeScript (.ts/.tsx) with strict type checking across frontend, backend, and E2E tests
- **Zustand state management** — 5-slice store architecture (auth, catalog, project, draft, UI) with subscriptions and pure-function selectors
- **Multi-tenant authentication** — Cognito-based auth with admin/editor roles, per-project editor permissions, and 10-minute token refresh
- **Draft/commit workflow** — Git-like editing model with 2-second auto-save, per-user draft locking (30-minute expiry), commit with messages, and full snapshot history
- **Subsystem inheritance** — Additions/exclusions model where subsystems store only deltas from the parent project stack
- **Admin panel** — Five-tab admin interface for roles, catalog management, project/subsystem CRUD, lock management, and cross-project activity feed
- **Cloud provider filtering** — Tag-based provider affinity (aws/azure/gcp) with cloud-agnostic item passthrough
- **Hierarchy view** — Parent-child tree display with automatic parent inclusion when children match filters
- **Read-only project view** — Shareable view at `/view/:projectId/:subsystemId?`
- **Export** — Copy stack as Markdown or JSON
- **CI/CD pipeline** — GitHub Actions with OIDC deploy, quality gates (ESLint, Prettier, Stylelint, TFLint), Trivy security scanning, TypeScript checking, Vitest tests, and post-deploy E2E smoke tests
- **E2E test infrastructure** — Dedicated Cognito test user, Secrets Manager config, automated credential management for CI and local development
- **Test suite** — 63 unit/integration tests covering selectors, diff computation, export formatting, route handlers, and full request lifecycle
- **Infrastructure as code** — Terraform modules for API Gateway, Cognito, and SPA hosting (S3 + CloudFront + WAF + ACM + Route 53)
- **Inline documentation** — Decision-oriented comments across all source files explaining architecture, workflows, and non-obvious design choices
- **Dependabot configuration** — Automated dependency updates for npm, Terraform, and GitHub Actions
- **Test coverage reporting** — Vitest v8 coverage provider with `npm run test:coverage`
