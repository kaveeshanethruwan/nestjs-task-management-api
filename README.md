# NestJS Task Management API

A NestJS application with JWT authentication, task management, and CSV import functionality.

## Prerequisites

- Node.js 20+
- Docker & Docker Compose

## Setup & Installation

1. **Install dependencies**

```bash
npm install
```

2. **Configure environment variables**

Create `.env` file:

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL='postgres://postgres:postgres@localhost:5432/nestjs_db'
DATABASE_PORT=5432

# JWT Authentication
JWT_SECRET=
JWT_EXPIRE_IN=1h
REFRESH_JWT_SECRET=
REFRESH_JWT_EXPIRE_IN=7d

# S3 / LocalStack
S3_ENDPOINT=http://localstack:4566
# S3_ENDPOINT=http://localhost:4566  # Uncomment for local development without Docker
S3_REGION=us-east-1
S3_BUCKET=tasks-csv
AWS_ACCESS_KEY_ID= Optional
AWS_SECRET_ACCESS_KEY= Optional

# Sentry (Optional)
SENTRY_DSN=your-sentry-dsn-here
```

3. **Create S3 bucket**

```bash
aws --endpoint-url=http://localhost:4566 s3 mb s3://tasks-csv
```

4. **Start application**

```bash
docker compose up -d
```

Application will be available at:

- API: http://localhost:3000
- Swagger: http://localhost:3000/api

## API Documentation

Access interactive API documentation at: **http://localhost:3000/api**

### Main Endpoints

**Authentication**

- `POST /auth/login` - Login and get JWT tokens
- `POST /auth/refresh` - Refresh access token
- `POST /auth/signout` - Logout

**Users**

- `POST /users` - Create user (public)
- `GET /users` - Get all users (public)
- `GET /users/profile` - Get current user profile (auth required)
- `GET /users/:id` - Get user by ID (admin only)
- `PATCH /users/:id` - Update user (admin only)
- `DELETE /users/:id` - Delete user (admin/editor/user roles)

**Tasks**

- `GET /tasks?page=1&limit=10` - List tasks with pagination
- `POST /tasks` - Create task
- `PATCH /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task
- `POST /tasks/upload-csv` - Bulk import from CSV

## Authentication

The application uses JWT access tokens (1h) and refresh tokens (7d).

**Usage:**

1. Create user via `POST /user`
2. Login via `POST /auth/login` to get tokens
3. Use `Authorization: Bearer <accessToken>` header for protected endpoints
4. Refresh token when access token expires

## Role-Based Access

- **USER**: Default role, can manage own tasks
- **EDITOR**
- **ADMIN**

## CSV Upload

Upload CSV with format:

```csv
title,description,status
Complete project documentation,Write comprehensive API documentation,pending
Review pull requests,Review and merge pending PRs,in_progress
Deploy to production,Deploy latest version to prod,pending
Fix critical bug,Fix authentication bug reported by QA,in_progress
Update dependencies,Update all npm packages to latest versions,done
```

### Sample File

See [sample-tasks.csv](./sample-tasks.csv) for reference.

## Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
npm test -- user.service.spec
npm test -- auth.controller.spec
npm test -- tasks
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Generate Coverage Report

```bash
npm run test:cov
```

Coverage report will be generated in `coverage/` directory.

### Test Structure

```
src/
├── user/
│   ├── user.controller.spec.ts  (7 tests)
│   └── user.service.spec.ts     (9 tests)
├── tasks/
│   ├── tasks.controller.spec.ts (9 tests)
│   └── tasks.service.spec.ts    (9 tests)
├── auth/
│   └── auth.controller.spec.ts  (4 tests)
└── app.controller.spec.ts       (1 test)
```

**Total**: 39 tests covering all controllers and services

---

## Logging

### Custom Logger Service

The app uses a structured logging system with:

- Request ID tracking (every request gets unique ID)
- User context (logs show which user made the request)
- Timestamp in ISO format
- Log levels (LOG, ERROR, WARN, DEBUG)
- Colored output for easy reading

## Sentry Integration

Sentry provides error monitoring and tracking for the application.

**Setup:**

1. Create a free account at https://sentry.io
2. Create a new project (select Node.js)
3. Copy the DSN from project settings
4. Add to `.env` file:

```env
SENTRY_DSN=your-sentry-dsn-here
```

5. Restart the application

To disable Sentry, leave `SENTRY_DSN` empty in `.env`.

## Development Notes

### Hot Reload

Docker setup uses development mode with hot reload. Changes to source files are automatically reflected in the running container.

### Viewing Logs

**View application logs:**

```bash
docker compose logs -f app
```

**View all services:**

```bash
docker compose logs -f
```

**View specific number of lines:**

```bash
docker compose logs --tail=100 app
```

## Tech Stack

- NestJS 11
- PostgreSQL 16
- TypeORM
- JWT Authentication
- Passport.js
- AWS S3 (LocalStack)
- Jest
- Sentry
- Docker
