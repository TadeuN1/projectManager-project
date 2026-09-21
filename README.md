# PManager — Fullstack Project Management System

![Java 21](https://img.shields.io/badge/Java-21-blue)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.0-green)
![React](https://img.shields.io/badge/React-18-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Docker](https://img.shields.io/badge/Docker-ready-blue)
![License MIT](https://img.shields.io/badge/License-MIT-yellow)

> Fullstack system for managing projects, tasks and team members: REST API in Java 21 + Spring Boot (MySQL + MongoDB) with a React + TypeScript web client. API Key authentication, task filtering with pagination, and Docker-ready local stack.

## Features

**Backend**
- Full CRUD for projects, tasks and members
- N-N links: members ↔ projects, tasks → project + assignee
- Task lifecycle `PENDING → IN_PROGRESS → FINISHED`; project progress derived from its tasks
- API Key authentication (custom Spring Security filter, keys stored in MongoDB)
- Task filtering by project, member, status, partial title + paginated results
- Bean validation with global exception handling
- Dual-database: MySQL (relational data via JPA/Hibernate) + MongoDB (API keys)

**Frontend (`/frontend`)**
- Tabs for Tasks, Projects and Members consuming the real API (`x-api-key` header)
- Create / edit / delete on all three resources
- Task filters (status, project, title search) + pagination controls
- Enforced domain rules in the UI: task requires a project and a project member as assignee; task duration must fit the project window; project only finishes with 100% of tasks done
- Friendly handling of constraint violations (no raw stack traces on screen)

## Tech Stack

| Layer    | Technologies |
| -------- | ------------ |
| Backend  | Java 21, Spring Boot 4, Spring Web MVC, Spring Data JPA/Hibernate, Spring Data MongoDB, Spring Security, Spring Validation, Lombok, Maven |
| Frontend | React 18, TypeScript, Vite, CSS, Fetch API |
| Data     | MySQL 8 (projects, tasks, members), MongoDB (API keys) |
| Infra    | Docker + Docker Compose, Vercel-ready frontend |

## Architecture

```
browser (React/Vite :5173)
   │  REST + x-api-key, CORS enabled
   ▼
API (Spring Boot :8080)
   ├── controller / dto / security / config / exception (infrastructure)
   └── entities / services / repositories (domain)
   ├── MySQL :3306  → projects, tasks, members
   └── MongoDB :27017 → api_keys
```

## Getting Started

### Prerequisites

- Java 21 or later (Maven wrapper included, no Maven install needed)
- Node 18+ and npm (for the frontend)
- MySQL 8 and MongoDB — locally **or** via Docker Compose

### 1. Clone

```sh
git clone https://github.com/TadeuN1/projectManager-project.git
cd projectManager-project
```

### 2. Databases (pick one)

With Docker (recommended):

```sh
docker compose up -d
```

Or use your local MySQL/MongoDB and adjust `src/main/resources/application.yml`:

```yaml
spring:
  data:
    mongodb:
      host: localhost
      port: 27017
      database: pmanagerdb
  datasource:
    url: jdbc:mysql://localhost:3306/pmanagerdb
    username: your-mysql-username
    password: your-mysql-password
app:
  security:
    masterApiKey: thekey # change me
```

### 3. Run the API

```sh
./mvnw spring-boot:run        # Windows: .\mvnw.cmd spring-boot:run
```

API at `http://localhost:8080`. Run tests with `./mvnw test`.

### 4. Run the frontend

```sh
cd frontend
npm install
npm run dev
```

App at `http://localhost:5173`. Optional `.env`:

```sh
VITE_API_URL=http://localhost:8080
VITE_API_KEY=thekey
```

## API Usage

All requests need the `x-api-key` header (master key from `application.yml`, default `thekey`, or a key created via the API).

```sh
curl 'http://localhost:8080/projects' -H 'x-api-key: thekey'

curl 'http://localhost:8080/tasks?status=PENDING&page=0' -H 'x-api-key: thekey'

curl -X POST 'http://localhost:8080/members' -H 'x-api-key: thekey' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada","email":"ada@example.com"}'
```

| Resource | Base path | Notes |
| -------- | --------- | ----- |
| Projects | `/projects` | Full CRUD + list all |
| Members  | `/members` | Full CRUD + filter by `email` |
| Tasks    | `/tasks` | Full CRUD + filters (`projectId`, `memberId`, `status`, `partialTitle`, `page`, `direction`, `sort`) |
| API Keys | `/apiKeys` | Create and revoke keys |

## Project Structure

```
.
├── src/                  # Spring Boot API (domain + infrastructure layers)
├── frontend/             # React + TypeScript web client
│   ├── src/api/          # typed API client (x-api-key)
│   └── src/              # tabs, filters, domain-rule enforcement
├── Dockerfile            # multi-stage API image (Temurin 21)
├── docker-compose.yml    # MySQL + MongoDB for local dev
```

## Roadmap

- [x] Fullstack CRUD with N-N links
- [x] UI domain rules (assignee, window, finish gate, pagination)
- [ ] Public demo (API on Render/Railway, frontend on Vercel)
- [ ] CI with GitHub Actions
- [ ] More backend tests

## License

MIT — see [LICENSE](LICENSE).
