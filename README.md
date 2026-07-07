# School Election System

A full-stack election platform for schools with:
- FastAPI backend
- React + Vite frontend
- PostgreSQL database
- Username/password signup and login
- Election management, candidate setup, voting by ballot number and symbol, and live results

## Supported Election Types
- School Student Leader (SPL)
- Class Leader
- Playtime Leader (Sports)
- Event Organizer Leader

## Project Structure

- `backend/` FastAPI API + DB models
- `frontend/` React app (Vite)
- `docker-compose.yml` PostgreSQL service

## 1) Run Full Stack with Docker

From project root:

```bash
docker compose up --build -d
```

This starts:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Postgres: `localhost:5432`

To stop:

```bash
docker compose down
```

## 2) Start PostgreSQL Only (optional)

If you prefer running backend/frontend locally but DB in Docker:

```bash
docker compose up -d postgres
```

## 3) Run Backend (FastAPI) locally

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Backend runs at `http://127.0.0.1:8000`.

## 4) Run Frontend (React + Vite) locally

In another terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs at `http://127.0.0.1:5173`.

## How Roles Work
- Any user signing up with a valid `ADMIN_SIGNUP_CODE` is created as `admin`.
- Use kiosk tab for assisted voting flow where students vote one-by-one.

## Core Features

### Authentication
- Signup with admin permission code
- Login with username + password
- JWT-based API auth

### Admin
- Create elections
- Set election type
- Add candidates (name, symbol, ballot number, optional class)
- Open/close elections
- View live results

### Voter
- See open elections
- Cast assisted votes by clicking candidate tiles in the dedicated voting tab
- In kiosk tab, one vote is taken at a time with a required gap before next student
- Vote using candidate number and symbol ballot cards
- See live vote counts

## Main API Endpoints

- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/me`
- `GET /election-types`
- `GET /elections`
- `POST /elections` (admin)
- `PUT /elections/{id}` (admin)
- `POST /elections/{id}/candidates` (admin)
- `GET /elections/{id}/candidates`
- `POST /elections/{id}/vote`
- `GET /elections/{id}/results`

## Notes
- Votes are stored in PostgreSQL (`votes` table), ensuring election result persistence.
- Result totals are aggregated live from stored votes.
- Account signup requires `ADMIN_SIGNUP_CODE` configured in backend environment.
- Kiosk next-vote delay is configurable with `KIOSK_VOTE_GAP_SECONDS`.
