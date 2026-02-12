# API Reference

All endpoints are served via API Gateway HTTP API at `https://api.stack-atlas.com`.

Auth levels: **Yes** = any authenticated user, **Editor** = project editor or admin, **Admin** = admins group member.

## Projects

| Method | Path                  | Auth   | Description            |
| ------ | --------------------- | ------ | ---------------------- |
| GET    | `/projects`           | Yes    | List all projects      |
| POST   | `/projects`           | Admin  | Create project         |
| PUT    | `/projects/:id`       | Admin  | Update project         |
| DELETE | `/projects/:id`       | Admin  | Delete project         |
| GET    | `/projects/:id/stack` | Yes    | Get committed stack    |
| PUT    | `/projects/:id/stack` | Editor | Update stack           |
| GET    | `/projects/:id/view`  | Yes    | Read-only project view |

## Subsystems

| Method | Path                              | Auth   | Description      |
| ------ | --------------------------------- | ------ | ---------------- |
| GET    | `/projects/:id/subsystems`        | Yes    | List subsystems  |
| POST   | `/projects/:id/subsystems`        | Editor | Create subsystem |
| PUT    | `/projects/:id/subsystems/:subId` | Editor | Update subsystem |
| DELETE | `/projects/:id/subsystems/:subId` | Editor | Delete subsystem |

## Drafts & Commits

| Method | Path                    | Auth   | Description        |
| ------ | ----------------------- | ------ | ------------------ |
| GET    | `/projects/:id/draft`   | Editor | Get current draft  |
| PUT    | `/projects/:id/draft`   | Editor | Save draft         |
| DELETE | `/projects/:id/draft`   | Editor | Discard draft      |
| POST   | `/projects/:id/commit`  | Editor | Commit draft       |
| GET    | `/projects/:id/commits` | Yes    | Get commit history |

## Admin

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
