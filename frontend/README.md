# PManager Frontend

React + TypeScript web client for the [PManager API](../README.md).

Tabs for Tasks, Projects and Members with full CRUD, filters, pagination and
UI-enforced domain rules (assignee must be a project member, task must fit the
project window, project only finishes with 100% of tasks done).

## Run

```sh
npm install
npm run dev
```

App at `http://localhost:5173` (API expected at `http://localhost:8080`).

Optional `.env` (see `.env.example`):

```sh
VITE_API_URL=http://localhost:8080
VITE_API_KEY=thekey
```

## Build

```sh
npm run build
```
