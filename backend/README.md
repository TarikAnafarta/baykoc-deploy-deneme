# BayKoç Backend

Django + REST Framework service that provides graph data endpoints and user authentication, backed by PostgreSQL.

## First-Time Setup

1. Copy environment variables: `cp backend/.env.example backend/.env`, then fill it.
2. Start the full stack (API, Postgres, Redis, etc.):

```powershell
docker compose up --build
```

3. Apply database migrations once the containers are healthy:

```powershell
cd backend 
python manage.py migrate
```

4. (Optional) create a superuser for admin access:

```powershell
cd backend
python manage.py createsuperuser
```

5. Visit `http://localhost:8000/api/` or `http://localhost:8000/admin/` to verify the service is responding.

## Daily Development

- `docker compose up` — restart the stack using the existing images.
- `docker compose down` — stop containers.
- `docker compose exec backend python manage.py test` — run backend test suite.

## Configuration

- All runtime settings live in `backend/.env`. Use `backend/.env.example` as a template.
- `FRONTEND_URL` must match the Vite dev server (default `http://localhost:5173`).
- Set `DB_*` variables when pointing to an external PostgreSQL instance.
- `REDIS_URL` should reference your Redis endpoint (Docker sets `redis://redis:6379/0`).

## API Overview

Base URL: `http://localhost:8000/api/`

- Graph
  - GET `/graph/data/`
  - GET `/graph/nodes/`
  - GET `/graph/links/`
  - GET `/graph/stats/`
- Users (base: `/api/users/`)
  - GET `/me/`
  - POST `/login/`, `/register/`, `/logout/`
  - POST `/change-password/`
  - POST `/verify/`, `/resend-verification/`
  - POST `/forgot-password/`, `/reset-password/`, `/reset-password/validate/`
  - POST `/complete-profile/`
  - GET `/auth/google/login/` (returns the Google authorization URL)
  - GET `/auth/google/callback/` (Google redirect target -> sends browser back to the frontend)


## Common Commands

```powershell
# Create a superuser
python manage.py createsuperuser

# Make and apply migrations
python manage.py makemigrations
python manage.py migrate

# Make database queries
python manage.py shell_plus
User.objects.all()
User.objects.filter(email='name@example.com')
```

### Google OAuth Setup

1. Create a **Google OAuth2 Web Client** in the Google Cloud Console with:
  - Authorized JavaScript origins: `http://localhost:5173` (or the value of `FRONTEND_URL`)
  - Authorized redirect URI: `<BACKEND_BASE_URL>/api/users/auth/google/callback` (defaults to `http://localhost:8000/...` locally)
2. Copy the credentials into `backend/.env`:

```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
BACKEND_BASE_URL=http://localhost:8000
GOOGLE_REDIRECT_PATH=/api/users/auth/google/callback
# Optional: uncomment to override the derived URI completely
# GOOGLE_REDIRECT_URI=https://your-backend.example.com/api/users/auth/google/callback
```

3. Restart `docker compose up` (or the Django server) after updating the `.env` file.