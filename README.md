# BayKoç

BayKoç visualizes curriculum learning graphs with a Django REST API and a React (Vite) frontend.

## Prerequisites

- Node.js 18+ with npm for running the Vite frontend. [Download Node.js](https://nodejs.org/en/download)
- Docker Desktop 4.x for the backend + PostgreSQL stack. [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Git and PowerShell 5.1+ on Windows (or any POSIX shell on macOS/Linux). [Download Git](https://git-scm.com/install/windows)
- Google Cloud credentials if you plan to enable OAuth login.

## Quick Start

1. **Clone** this repository and open it in your terminal/editor.
2. **Configure env files**:
	- `cp backend/.env.example backend/.env` and fill it.
	- `cp frontend/.env.example frontend/.env` and fill it.
3. **Backend** (requires Docker):

	```powershell
	docker compose up --build
	cd backend 
    python manage.py migrate
	```

4. **Frontend** (requires Node.js):

	```powershell
	cd frontend
	npm install
	npm run dev   # Vite dev server at http://localhost:5173
	```

5. Visit `http://localhost:5173` (frontend) and ensure it can talk to `http://localhost:8000/api/` (backend). See the per-project READMEs below for details, scripts, and troubleshooting tips.

## Features

- React (Vite) for UI: auth, dashboard, settings, graph
- Django + DRF API for graph data and user accounts
- Google OAuth2 login flow
- PostgreSQL via Docker Compose

## Documentation

- `backend/README.md` — Backend API, Docker workflow, OAuth setup
- `frontend/README.md` — Frontend prerequisites, scripts, and Google OAuth flow

## Project Structure

- `backend/` — Django project, Dockerfile, scripts
- `frontend/` — React (Vite) app
- `docker-compose.yml` — Local development stack (API, PostgreSQL, etc.)
- `data/`, `media/`, `staticfiles/` — Content roots referenced by the backend

## License

All rights reserved — see the [LICENSE](LICENSE) file for details.

### Third-Party Libraries
- React, React Router, Vite
- D3.js
- Django, Django REST Framework
- Cloudinary (django-cloudinary-storage)
