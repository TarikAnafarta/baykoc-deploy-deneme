# BayKoç Frontend

React (Vite) app for the BayKoç UI.

## First-Time Setup

1. Install Node.js if it is not already on your machine, then open a terminal.
2. `cd frontend`
3. Copy configuration: `cp .env.example .env` (or create `.env` manually) and set `VITE_API_URL` to the backend origin.
4. Install dependencies once: `npm install`

## Running the App

```powershell
cd frontend
npm run dev   # starts Vite at http://localhost:5173
```

When the backend runs at `http://localhost:8000`, set `VITE_API_URL=http://localhost:8000` so API calls hit `${VITE_API_URL}/api`.

### Available Scripts

- `npm run dev` — Vite dev server with hot reloading.
- `npm run build` — Production build output in `dist/`.
- `npm run preview` — Serves the latest build for smoke testing.
- `npm run test` — Runs Vitest unit/component tests (`frontend/test/setup.js`).

## Configuration

- Ensure the backend allows the frontend origin in `backend/.env`: `FRONTEND_URL=http://localhost:5173`.
- Update `frontend/.env` for local/remote API hosts and feature flags.
- `http://localhost:5173` is the Vite dev server; `http://localhost:8000` is the Django backend host.

## Google OAuth Flow

- The **Login** page exposes a "Google ile Devam Et" button that calls `GET /api/users/auth/google/login/` to obtain Google's consent URL.
- Google redirects back to the backend at `/api/users/auth/google/callback/`, which forwards the browser to the frontend route `/auth/google/callback` with the DRF token.
- `AuthProvider` (global context in `src/context/AuthContext.jsx`) stores the token in `localStorage`, loads `/api/users/me/`, and keeps the authenticated user in React state.
- **Backend callback details:**
	- Signs an OAuth state token to carry a sanitized `next` path.
	- Exchanges Google's authorization code for an ID token.
	- Creates/updates the matching BayKoç user, storing the Google `sub` (`google_sub` field).
	- Issues a DRF auth token and redirects the browser back to `FRONTEND_URL` with the token in the query string.

## Structure

- `src/views/auth` — Login, Register, Verify, CompleteProfile
- `src/views/home` — Dashboard
- `src/views/settings` — Profile
- `src/views/graph` — Graph visualization
- `src/ui` — App layout/components
- `src/main.jsx` — Routing and app bootstrap
