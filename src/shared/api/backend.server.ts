import 'server-only';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { BACKEND_ORIGIN, REFRESH_COOKIE } from '@/shared/config/env';
import type { TokenResponse } from './types';

const TIMEOUT_MS = 65_000;

/** Server → backend call. No Origin header is sent, so backend CORS rules don't apply. */
export async function backendFetch(
	path: string,
	init: RequestInit & { lang?: string | null } = {},
) {
	const { lang, headers, ...rest } = init;
	const h = new Headers(headers);
	h.set('Accept', 'application/json, application/problem+json');
	if (lang) h.set('Accept-Language', lang);
	return fetch(`${BACKEND_ORIGIN}/api/v1${path}`, {
		...rest,
		headers: h,
		cache: 'no-store',
		signal: AbortSignal.timeout(TIMEOUT_MS),
	});
}

export function gatewayError(e: unknown) {
	const timeout =
		e instanceof DOMException && (e.name === 'TimeoutError' || e.name === 'AbortError');
	return NextResponse.json(
		{
			status: timeout ? 504 : 502,
			code: timeout ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_UNREACHABLE',
			detail: timeout ? 'Backend did not respond in time' : 'Backend is unreachable',
		},
		{ status: timeout ? 504 : 502, headers: { 'content-type': 'application/problem+json' } },
	);
}

/** Pass a backend response through unchanged (status, content-type, body). */
export async function passthrough(res: Response) {
	const body = await res.arrayBuffer();
	const headers = new Headers();
	const ct = res.headers.get('content-type');
	if (ct) headers.set('content-type', ct);
	const rid = res.headers.get('x-request-id');
	if (rid) headers.set('x-request-id', rid);
	return new NextResponse(res.status === 204 ? null : body, { status: res.status, headers });
}

export async function readRefreshCookie() {
	return (await cookies()).get(REFRESH_COOKIE)?.value;
}

export async function writeRefreshCookie(
	t: Pick<TokenResponse, 'refreshToken' | 'refreshTokenExpiresAt'>,
) {
	if (!t.refreshToken) return;
	const expires = t.refreshTokenExpiresAt ? new Date(t.refreshTokenExpiresAt) : undefined;
	(await cookies()).set(REFRESH_COOKIE, t.refreshToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict',
		path: '/',
		expires,
	});
}

export async function clearRefreshCookie() {
	(await cookies()).delete(REFRESH_COOKIE);
}

/** Strip the refresh token before anything reaches the browser. */
export function toSessionPayload(t: TokenResponse) {
	return { accessToken: t.accessToken, accessTokenExpiresAt: t.accessTokenExpiresAt, user: t.user };
}

export async function revokeRefreshToken(refreshToken: string, lang?: string | null) {
	try {
		await backendFetch('/auth/logout', {
			method: 'POST',
			lang,
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ refreshToken }),
		});
	} catch {
		// best effort
	}
}
