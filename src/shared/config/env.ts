/**
 * Server-only: backend origin (runtime env, never inlined into the browser bundle — see the
 * app/api/v1 proxy). Validated at server start in `src/instrumentation.ts`.
 */
export const BACKEND_ORIGIN = (process.env.API_URL ?? '').replace(/\/+$/, '');

/** Browser-side base path for API calls (same-origin proxy). */
export const API_BASE = '/api/v1';

/** httpOnly cookie holding the rotating refresh token. */
export const REFRESH_COOKIE = 'usta_rt';
