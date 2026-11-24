'use client';

import type { UserResponse } from './types';

/**
 * Access token lives only in memory; the rotating refresh token lives in an httpOnly
 * cookie managed by the /api/session route handlers (plan §5, variant A).
 */
export interface SessionPayload {
	accessToken: string;
	accessTokenExpiresAt: string;
	user: UserResponse;
}

interface Session {
	accessToken: string;
	expiresAt: number;
	user: UserResponse;
}

let session: Session | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

export const sessionStore = {
	get: () => session,
	set(p: SessionPayload) {
		session = {
			accessToken: p.accessToken,
			expiresAt: Date.parse(p.accessTokenExpiresAt) || 0,
			user: p.user,
		};
		emit();
	},
	clear() {
		session = null;
		emit();
	},
	subscribe(l: () => void) {
		listeners.add(l);
		return () => listeners.delete(l);
	},
};

/** Thrown when the refresh token is missing/expired — the user must log in again. */
export class SessionExpiredError extends Error {
	constructor() {
		super('SESSION_EXPIRED');
	}
}

/** Refresh slightly before expiry so in-flight requests don't race the deadline. */
const EXPIRY_SKEW_MS = 30_000;

let refreshing: Promise<string> | null = null;

/**
 * The backend rotates the refresh token on every call, so only one refresh may be in
 * flight: concurrent callers share one promise, and other tabs are serialised with the
 * Web Locks API (they then read the already-rotated cookie).
 */
export function refreshSession(): Promise<string> {
	refreshing ??= runExclusive(doRefresh).finally(() => {
		refreshing = null;
	});
	return refreshing;
}

async function runExclusive<T>(fn: () => Promise<T>): Promise<T> {
	if (typeof navigator !== 'undefined' && navigator.locks) {
		return navigator.locks.request('usta-admin-refresh', fn);
	}
	return fn();
}

async function doRefresh(): Promise<string> {
	const res = await fetch('/api/session/refresh', { method: 'POST', credentials: 'same-origin' });
	if (res.status === 401 || res.status === 403) {
		sessionStore.clear();
		throw new SessionExpiredError();
	}
	if (!res.ok) throw new Error(`REFRESH_FAILED_${res.status}`);
	const data = (await res.json()) as SessionPayload;
	sessionStore.set(data);
	return data.accessToken;
}

export async function ensureAccessToken(): Promise<string> {
	const s = sessionStore.get();
	if (s && s.expiresAt - Date.now() > EXPIRY_SKEW_MS) return s.accessToken;
	return refreshSession();
}

export async function logout() {
	try {
		await fetch('/api/session', { method: 'DELETE', credentials: 'same-origin' });
	} finally {
		sessionStore.clear();
	}
}
