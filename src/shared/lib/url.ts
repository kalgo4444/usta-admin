/**
 * Only allow http(s) URLs (absolute, relative or protocol-relative) for backend-supplied
 * links — blocks `javascript:`, `data:` and other schemes in href. The dummy base only
 * makes relative URLs parseable; the original string is returned unchanged.
 */
export function safeHttpUrl(url: string | null | undefined): string | undefined {
	if (!url) return undefined;
	try {
		const { protocol } = new URL(url, 'http://relative.invalid');
		return protocol === 'https:' || protocol === 'http:' ? url : undefined;
	} catch {
		return undefined;
	}
}

/**
 * Same-origin path to go to after login, or `fallback`. Rejects other origins, the login
 * page itself, and paths that normalise to `//host` (e.g. `/.//evil.com`), which the
 * router would treat as a protocol-relative URL to another site.
 */
export function safeNextPath(
	next: string | null,
	origin: string,
	fallback: string,
	loginPath: string,
): string {
	if (!next) return fallback;
	try {
		const u = new URL(next, origin);
		const isLogin = u.pathname === loginPath || u.pathname.startsWith(`${loginPath}/`);
		if (u.origin !== origin || isLogin || !/^\/(?![/\\])/.test(u.pathname)) return fallback;
		return u.pathname + u.search + u.hash;
	} catch {
		return fallback;
	}
}
