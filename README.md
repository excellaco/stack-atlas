# Stack Atlas

Unify how teams describe their technology stacks. Stack Atlas provides a curated catalog of technologies that teams filter, select, and export as standardized stack definitions for side-by-side comparison across programs.

## Features

- **Curated Catalog** — Browse technologies organized by category (compute, storage, networking, security, etc.) with search, type filters, and tag filtering
- **Cloud Provider Filtering** — Select AWS, Azure, or GCP to filter out other providers while keeping cloud-agnostic technologies
- **Project Management** — Create projects to track team technology selections with full CRUD via admin panel
- **Subsystem Inheritance** — Define a base system, then create subsystems that inherit all base technologies and add their own
- **Draft/Commit Workflow** — Auto-saved drafts with 2-second debounce, commit with messages, full commit history with diffs
- **Export** — Copy stack output as Markdown or JSON
- **Read-Only View** — Shareable project view at `/view/:projectId/:subsystemId`
- **Role-Based Access** — Admin and editor roles via Cognito groups
- **Multi-Tenant** — Per-user draft locking, project-scoped editor permissions

## Tech Stack

| Layer    | Technology                                   |
| -------- | -------------------------------------------- |
| Frontend | React 18, Vite, React Router, React Markdown |
| Backend  | Node.js 24, AWS Lambda, esbuild              |
| Auth     | Amazon Cognito                               |
| Data     | Amazon S3 (JSON documents)                   |
| API      | API Gateway HTTP API                         |
| CDN      | CloudFront                                   |
| DNS/TLS  | Route53, ACM                                 |
| IaC      | Terraform                                    |

## Quick Start

### Prerequisites

- Node.js 24+
- npm
- AWS CLI (configured with credentials)
- Terraform 1.0+

### Local Development

```bash
# Install dependencies
cd frontend && npm install
cd ../backend && npm install

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
./scripts/deploy.sh
```

This script:

1. Builds frontend and backend
2. Creates/configures the Terraform state bucket
3. Runs `terraform apply`
4. Outputs the site URL, API endpoint, and seed user credentials

## Project Structure

```
stack-atlas/
├── frontend/              # React SPA
│   └── src/
│       ├── App.jsx        # Main application component
│       ├── api.js         # API client
│       ├── auth.js        # Cognito authentication
│       ├── components/    # UI components (each with dedicated .css)
│       ├── data/          # Static catalog data
│       └── utils/         # Search, tree, export, diff utilities
├── backend/               # Lambda API handler
│   └── src/
│       ├── handler.js     # Entry point
│       ├── storage.js     # S3 data layer
│       └── routes/        # Route handlers (projects, subsystems, drafts, admin)
├── infrastructure/        # Terraform
│   └── terraform/
│       ├── stack-atlas.tf # Main resources
│       └── modules/       # api-http, cognito, spa-website
└── scripts/
    └── deploy.sh          # Automated deployment
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

Runtime configuration is loaded from `window.__APP_CONFIG__` (injected by the SPA hosting module) with fallback to Vite environment variables:

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

Private
