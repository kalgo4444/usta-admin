import 'server-only';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { BACKEND_ORIGIN, REFRESH_COOKIE } from '@/shared/config/env';
import { isAdmin } from '@/shared/lib/access';
import type { TokenResponse } from './types';

const TIMEOUT_MS = 65_000;

/** JSON bodies are small; anything bigger is rejected before buffering. */
const MAX_BODY_BYTES = 1024 * 1024;
/** Catalog images are ≤ 5 MB; leave room for the multipart envelope. */
export const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;

/** RFC 9457 problem+json response, the same shape the backend uses (`status`, `code`, `detail`). */
export function problem(status: number, code: string, detail?: string) {
	return NextResponse.json(
		{ status, code, detail: detail ?? code },
		{ status, headers: { 'content-type': 'application/problem+json' } },
	);
}

/**
 * Read the request body with a byte cap (Content-Length is checked first, then the stream
 * is counted so chunked bodies can't bypass it). Returns a problem response instead of the
 * body when the cap is exceeded or the stream fails (e.g. the client aborted).
 */
export async function readBodyLimited(
	req: Request,
	max = MAX_BODY_BYTES,
): Promise<Uint8Array<ArrayBuffer> | NextResponse> {
	const tooLarge = () => problem(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large');
	if (Number(req.headers.get('content-length')) > max) return tooLarge();
	if (!req.body) return new Uint8Array(0);

	const reader = req.body.getReader();
	const chunks: Uint8Array[] = [];
	let size = 0;
	try {
		for (;;) {
			const { done, value } = await reader.read();
			if (done) break;
			size += value.byteLength;
			if (size > max) {
				await reader.cancel();
				return tooLarge();
			}
			chunks.push(value);
		}
	} catch {
		return problem(400, 'BAD_REQUEST_BODY', 'Request body could not be read');
	}
	return new Uint8Array(Buffer.concat(chunks));
}

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
	return timeout
		? problem(504, 'UPSTREAM_TIMEOUT', 'Backend did not respond in time')
		: problem(502, 'UPSTREAM_UNREACHABLE', 'Backend is unreachable');
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

/** Parse a successful token response; null when the body is not a usable TokenResponse. */
export async function readTokens(res: Response): Promise<TokenResponse | null> {
	try {
		const t = (await res.json()) as TokenResponse;
		return t?.accessToken && t.user ? t : null;
	} catch {
		return null;
	}
}

/** Only an ACTIVE user with the ADMIN or SUPER_ADMIN role may hold an admin session. */
export function isActiveAdmin(user: TokenResponse['user'] | undefined) {
	return isAdmin(user) && user?.status === 'ACTIVE';
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
