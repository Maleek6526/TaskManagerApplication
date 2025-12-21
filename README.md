# Task Manager Application (React + Vite)

A simple, full‑stack task manager with authentication, role‑based actions, and a detailed activity log. Built with React (Vite) on the frontend and Express + Prisma + MySQL on the backend.

## Overview
- Manage tasks: create, update, complete, and delete.
- Role‑based controls: Admin can create/delete; User can update/complete.
- Authentication: JWT login with `ADMIN` and `USER` roles.
- Activity Log: rich entries with action, actor, task, details, timestamp; grouped by date with client‑side pagination.
- Polished UI: green "Complete" and red "Delete" buttons; author label shows "By You" or hides when unknown.
- Health & stability: `/healthz` endpoint and global error logging.

## Tech Stack
- Frontend: React + Vite, Tailwind (CSS), Vitest.
- Backend: Node.js (Express), Prisma ORM, MySQL.
- Database: MySQL (PlanetScale‑friendly via `relationMode = "prisma"`).

## Local Development
1. Backend
   - `cd backend`
   - Set required env vars (see Env section) and a valid `DATABASE_URL`.
   - `npm install`
   - `npm run prisma:generate`
   - Create schema: `npx prisma db push`
   - Seed: `npm run db:seed`
   - Run: `npm start` (listens on `PORT` or `3002`).
2. Frontend
   - `cd frontend`
   - Set `VITE_API_BASE_URL` in `.env` (e.g., `http://localhost:3002`).
   - `npm install`
   - `npm run dev`

## Environment Variables
Backend (`backend/.env` or Render env):
- `DATABASE_URL` (MySQL connection string)
- `JWT_SECRET` (any strong secret)
- `ADMIN_USERNAME : admin `, `ADMIN_PASSWORD : admin123 `
- `USER_USERNAME : user `, `USER_PASSWORD : user123`
Frontend (`frontend/.env` or Render env):
- `VITE_API_BASE_URL` (backend base URL)

## Scripts
Backend:
- `npm start` — start API
- `npm run dev` — dev with nodemon
- `npm run prisma:generate` — generate Prisma client
- `npx prisma db push` — create/update schema
- `npm run db:seed` — seed users + welcome task
- `npm test` — run backend tests
Frontend:
- `npm run dev` — start Vite dev server
- `npm run build` — build production bundle
- `npm run preview` — preview build
- `npm test` — run frontend tests

## Deployment (Render + PlanetScale)
- Database: create a free PlanetScale DB and copy the Prisma `DATABASE_URL`.
- Backend (Render Web Service):
  - Build: `npm install && npm run prisma:generate`
  - Start: `npm start`
  - Env: set `DATABASE_URL`, `JWT_SECRET`, admin/user creds.
  - Health: `/healthz` should return status ok.
- Frontend (Render Static Site):
  - Build: `npm install && npm run build`
  - Publish: `dist`
  - Env: `VITE_API_BASE_URL` = your backend URL.
- Optional: use `render.yaml` at repo root for one‑click blueprint.

## API Endpoints (summary)
- `POST /auth/login` — JWT login
- `GET /tasks` — list tasks
- `POST /tasks` — create (Admin)
- `PUT /tasks/:id` — update/complete
- `DELETE /tasks/:id` — delete (Admin)
- `GET /activity` — activity log (Admin)
- `GET /healthz` — readiness check

## Test Status
- Frontend and backend tests pass, confirming UI and API integrity.

## Notes
- Activity Log UI supports date grouping and client‑side pagination for long lists.
- Prisma `relationMode = "prisma"` ensures compatibility with PlanetScale (no FKs).


## Live Testing 
- https://taskmanageruiapplication.onrender.com
