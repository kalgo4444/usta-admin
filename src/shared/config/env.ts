/** Server-only: backend origin. The browser never calls it directly (CORS) — see app/api/v1 proxy. */
const DEFAULT_BACKEND_ORIGIN = 'https://usta-platform-nwtz.onrender.com';

// `typeof window` guard: this module is also bundled into the browser (API_BASE), where server-only
// env vars like API_URL are never inlined and would always look unset.
if (
	typeof window === 'undefined' &&
	!process.env.API_URL &&
	process.env.NODE_ENV === 'development'
) {
	// Don't let a forgotten .env point local development at the production backend.
	throw new Error('API_URL is not set. Copy .env.example to .env and set the backend origin.');
}

export const BACKEND_ORIGIN = (process.env.API_URL || DEFAULT_BACKEND_ORIGIN).replace(/\/+$/, '');

/** Browser-side base path for API calls (same-origin proxy). */
export const API_BASE = '/api/v1';

/** httpOnly cookie holding the rotating refresh token. */
export const REFRESH_COOKIE = 'usta_rt';
