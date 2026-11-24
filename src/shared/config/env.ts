/** Server-only: backend origin. The browser never calls it directly (CORS) — see app/api/v1 proxy. */
export const BACKEND_ORIGIN = (
	process.env.API_URL || 'https://usta-platform-nwtz.onrender.com'
).replace(/\/+$/, '');

/** Browser-side base path for API calls (same-origin proxy). */
export const API_BASE = '/api/v1';

/** httpOnly cookie holding the rotating refresh token. */
export const REFRESH_COOKIE = 'usta_rt';
