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
- **Admin Panel** — Manage roles, publish the catalog, create/delete projects and subsystems, view active locks, and browse cross-project activity

## Tech Stack

| Layer    | Technology                                             |
| -------- | ------------------------------------------------------ |
| Frontend | React 19, TypeScript, Vite, Zustand, React Router      |
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

This script checks prerequisites, builds frontend and backend, creates the Terraform state bucket, runs `terraform apply`, and outputs the site URL, API endpoint, and seed user credentials.

## Documentation

| Document                             | Description                                   |
| ------------------------------------ | --------------------------------------------- |
| [API Reference](docs/api.md)         | All REST endpoints with auth levels           |
| [Architecture](docs/architecture.md) | Project structure and configuration reference |
| [Development](docs/development.md)   | Testing, linting, CI pipeline                 |
| [Changelog](CHANGELOG.md)            | Release history                               |
| [Roadmap](ROADMAP.md)                | Planned features and enhancements             |

## License

MIT License. See [LICENSE](LICENSE) for details.
