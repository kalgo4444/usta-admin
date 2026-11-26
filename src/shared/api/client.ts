'use client';

import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE } from '@/shared/config/env';
import { routes } from '@/shared/config/routes';
import { localeStore } from '@/shared/i18n/locale';
import { sanitizeDeep } from '@/shared/lib/text';
import { toApiError } from './errors';
import { trackRequest } from './server-status';
import { ensureAccessToken, logout, refreshSession, SessionExpiredError } from './session';

declare module 'axios' {
	interface AxiosRequestConfig {
		/** Skip attaching the bearer token (public endpoints). */
		skipAuth?: boolean;
		_retry?: boolean;
		_done?: () => void;
	}
}

export const api = axios.create({
	baseURL: API_BASE,
	timeout: 60_000, // Render cold start can take up to a minute
	paramsSerializer: { indexes: null }, // sort=a,DESC&sort=b,ASC
});

function redirectToLogin() {
	if (typeof window !== 'undefined' && window.location.pathname !== routes.login) {
		const next = encodeURIComponent(window.location.pathname + window.location.search);
		window.location.replace(`${routes.login}?next=${next}`);
	}
}

api.interceptors.request.use(async (cfg: InternalAxiosRequestConfig) => {
	cfg._done = trackRequest();
	cfg.headers.set('Accept-Language', localeStore.get());
	// The backend rejects invisible/control characters (400); FormData uploads pass as-is.
	if (cfg.data && !(cfg.data instanceof FormData)) cfg.data = sanitizeDeep(cfg.data);
	if (!cfg.skipAuth) {
		try {
			cfg.headers.set('Authorization', `Bearer ${await ensureAccessToken()}`);
		} catch (e) {
			cfg._done?.();
			if (e instanceof SessionExpiredError) redirectToLogin();
			throw e;
		}
	}
	return cfg;
});

api.interceptors.response.use(
	res => {
		res.config._done?.();
		return res;
	},
	async err => {
		const original = err.config as AxiosRequestConfig | undefined;
		original?._done?.();
		// 401 covers both an expired token and TOKEN_OUTDATED (permissions changed):
		// a refresh returns a token with the new permissions.
		if (err.response?.status === 401 && original && !original.skipAuth && !original._retry) {
			original._retry = true;
			try {
				const access = await refreshSession();
				original.headers = { ...original.headers, Authorization: `Bearer ${access}` };
				return api(original);
			} catch (e) {
				if (e instanceof SessionExpiredError) redirectToLogin();
				throw toApiError(e);
			}
		}
		const apiErr = toApiError(err);
		// Blocked or deleted account: may arrive on any request.
		if (apiErr.status === 403 && apiErr.code === 'USER_BLOCKED' && !original?.skipAuth) {
			void logout().finally(redirectToLogin);
		}
		throw apiErr;
	},
);

/** Thin typed helpers — return `data` directly. */
export const http = {
	get: <T>(url: string, params?: object, cfg?: AxiosRequestConfig) =>
		api.get<T>(url, { ...cfg, params }).then(r => r.data),
	post: <T>(url: string, body?: unknown, cfg?: AxiosRequestConfig) =>
		api.post<T>(url, body, cfg).then(r => r.data),
	put: <T>(url: string, body?: unknown, cfg?: AxiosRequestConfig) =>
		api.put<T>(url, body, cfg).then(r => r.data),
	delete: <T = void>(url: string, params?: object, cfg?: AxiosRequestConfig) =>
		api.delete<T>(url, { ...cfg, params }).then(r => r.data),
};

/** Drop empty filter values so they don't reach the backend as `?status=`. */
export function cleanParams<T extends object>(p: T): Partial<T> {
	return Object.fromEntries(
		Object.entries(p).filter(([, v]) => v !== undefined && v !== null && v !== ''),
	) as Partial<T>;
}
