# Security Review — usta-admin

- **Date:** 2026-11-25
- **Source ref:** `76b012b` on `dev`, **dirty worktree** (the reviewed code is mostly uncommitted)
- **Profile / scope:** single-pass source review of `src/` (BFF routes, session handling, proxy, login flow, rendering of backend data), plus `npm audit --omit=dev`. Partial coverage: no sub-agent waves, no executed target code. Only Node `URL` parsing was run locally, with no target code and no network.
- **Not covered:** the backend (`usta-platform`), deployment config (headers, WAF, hosting), and per-page business logic beyond the grep sweep below.

## Summary

| #   | Finding                                                                                      | Status                                                       | Severity      |
| --- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------- |
| 1   | Open redirect after login via `?next=/\host`                                                 | Confirmed (URL semantics verified)                           | Medium        |
| 2   | `/api/v1/*` proxy path traversal escapes `/api/v1` and bypasses the token-endpoint blocklist | Confirmed in source; Next.js param decoding needs validation | Medium        |
| 3   | No security response headers (CSP, frame-ancestors, etc.)                                    | Needs validation (deployment)                                | —             |
| 4   | Backend-supplied attachment/document URLs rendered unvalidated in `href`                     | Needs validation (backend)                                   | —             |
| 5   | Access token returned to JS; no CSRF token on `/api/session*`                                | Informational / by design                                    | Informational |

`npm audit --omit=dev`: 0 known vulnerabilities.

---

## 1. Open redirect after login (`safeNext`)

**File:** `src/features/auth-otp/login-form.tsx:31-35`, used at `:95`

```ts
function safeNext(next) {
	return next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith(routes.login)
		? next
		: routes.overview;
}
```

- **Boundary:** an attacker-controlled link (`/login?next=...`) sets where the admin lands after authenticating.
- **Flaw:** `/\evil.com` passes the check. WHATWG URL parsing treats `\` as `/` for http(s), so the path resolves to a different origin. Verified locally: `new URL("/\\evil.com", "https://admin.example").href` gives `https://evil.com/`.
- **Impact:** after a real OTP login, an admin is sent to an attacker page that can imitate the admin UI (for example, a "session expired, re-enter your code" prompt). Needs a lure click and the user completing login. Next's `router.replace` falls back to a hard navigation for non-local URLs. This last step was not executed, so treat the exact router behavior as a minor assumption.
- **Same pattern:** `proxy.ts:16` and `client.ts:28` only _generate_ `next` from real paths, so they are not affected. The sink is `safeNext`.
- **Fix:** parse the value and compare origins.

```ts
function safeNext(next: string | null) {
	if (!next) return routes.overview;
	try {
		const u = new URL(next, window.location.origin);
		if (u.origin !== window.location.origin || u.pathname.startsWith(routes.login))
			return routes.overview;
		return u.pathname + u.search + u.hash;
	} catch {
		return routes.overview;
	}
}
```

Add a regression test for `/\evil.com`, `/\/evil.com`, `//evil.com`, `/%5Cevil.com` and `/%09/evil.com`.

## 2. Proxy path traversal in `/api/v1/[...path]`

**File:** `src/app/api/v1/[...path]/route.ts:15-31`

- **Flaw:** each segment is passed through `encodeURIComponent`, but `.` and `..` are unchanged. The joined string is appended to `${BACKEND_ORIGIN}/api/v1`, and `fetch` normalizes dot segments. Verified locally:
  - `https://b.example/api/v1/x/../../actuator/env` resolves to `https://b.example/api/actuator/env`, which is outside `/api/v1`. More `../` segments reach the backend root.
  - `https://b.example/api/v1/x/../auth/refresh` resolves to `/api/v1/auth/refresh`. The `BLOCKED` check compares the raw joined string (`x/../auth/refresh`), so it passes and the blocked token endpoints become reachable.
- **Boundary:**
  - Any browser client, authenticated or not, can reach arbitrary backend paths such as actuator, swagger, internal or admin routes that were never meant to be exposed through the BFF. The request goes out with the forwarded `Authorization`/`Content-Type` headers.
  - The documented invariant "refresh token never reaches JavaScript" is defeated: `POST /api/v1/x/../auth/otp/verify` returns `refreshToken` in the body to the browser. That makes any future XSS far more damaging, and it bypasses the ADMIN-role check done in `/api/session`.
- **Needs validation:** whether Next.js hands `..` (including `%2e%2e`) through as `path` entries, or rejects or normalizes them before routing. Source gives no guarantee. Confirm with a loopback `next dev`/`next start` instance against a mock backend, requesting `/api/v1/x/%2e%2e/%2e%2e/probe`. Test both raw `..` and encoded forms, and check the mock's received path.
- **Severity:** medium if reachable; the blast radius depends on what the backend exposes outside `/api/v1`.
- **Fix:** reject traversal at the last trusted point, and compare the _normalized_ path against the blocklist.

```ts
if (
	path.some(s => s === '.' || s === '..' || s.includes('/') || s.includes('\\') || s.includes('\0'))
)
	return NextResponse.json({ status: 400 }, { status: 400 });
```

Then build the URL with `new URL()` and assert `u.pathname.startsWith("/api/v1/")` before fetching. Better still, replace the blocklist with an allowlist of the endpoints the admin actually uses.

## 3. No security headers (needs validation)

**File:** `next.config.ts` has no `headers()`, and no `proxy.ts` response sets any. Nothing in the repo sets CSP, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy` or `X-Content-Type-Options`.

- For a privileged admin console, missing `frame-ancestors` means the UI can be framed (clickjacking on actions such as block user, settle invoice, resolve dispute). A missing CSP removes the main backstop against XSS, which matters because the access token is in JS memory.
- Whether the host or CDN adds these headers is not visible in the repo. **Owner check:** `curl -I` against the deployed origin (a one-off read of your own deployment).
- **Fix:** add `headers()` in `next.config.ts` with `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`, and a CSP. The CSP must allow `https://www.openstreetmap.org` for the map iframe (`location-map.tsx:21`, plus `frame-src`) and the presigned image/media host in `img-src`/`media-src`.

## 4. Unvalidated backend URLs in `href`/`src` (needs validation)

**Files:** `src/widgets/order-detail/attachments.tsx:17-27` (`<a href={a.url}>`), `src/widgets/master-detail/documents-gallery.tsx:54` (`<a href={d.url}>`). `<img>`/`<video>` sinks (`src=`) are not script-capable.

- Master documents and order attachments are uploaded by lower-trust users (customers and masters), and an admin opens them. If the backend ever returned a user-controlled `javascript:` or `data:` URL (rather than only server-generated presigned URLs, as the code comments assume), clicking it would run script in the admin origin. `rel="noopener noreferrer"` doesn't help against `javascript:`.
- **Needs backend confirmation:** URLs are always generated server-side by the storage layer, never taken from client input.
- **Fix, a cheap defense in depth:** a `safeHttpUrl()` helper that only accepts `https:` URLs, applied to every backend-sourced `href`.

## 5. Informational

- **Session design is sound:** the refresh token is in an `httpOnly`, `secure` (production), `SameSite=Strict` cookie. The access token is kept in memory only. Login and refresh both enforce `ADMIN` and `!BLOCKED` and revoke the token on rejection (`app/api/session/route.ts:33-41`, `refresh/route.ts:40-44`). `SameSite=Strict` covers CSRF on `POST /api/session/refresh` and `DELETE /api/session`; cross-origin callers can't read the response.
- **`proxy.ts` is only a cookie-presence redirect**, as its comment says. It is not authorization, and the real check is the backend plus the client guard. Keep every sensitive operation enforced server-side in the backend; a client can ignore all of this UI gating.
- **No server-side validation or rate limiting** in the BFF on `/api/session` (body is forwarded as-is). OTP brute-force and rate limits must live in the backend; that was not reviewed here.
- **Header allowlist** on the proxy (`authorization`, `content-type`, `accept-language`) is good: cookies and hop headers aren't forwarded. Responses pass only `content-type` and `x-request-id`.
- **`API_URL` is env-controlled** and falls back to the public Render backend. No SSRF from user input in the host portion, apart from finding 2, which stays on the same origin.
- **Rendering:** no `dangerouslySetInnerHTML`, `innerHTML` or `eval` anywhere in `src/`; chat and complaint text goes through React escaping. `localStorage` holds only the locale.
- **Dependencies:** `npm audit` is clean. Versions in `package.json` are newer than my knowledge, so not independently checked.

## Recommended order of work

1. Fix finding 2 (proxy traversal and blocklist) and finding 1 (`safeNext`). Both are small, local changes.
2. Add security headers (finding 3) once the deployment answer is known.
3. Confirm finding 4 with the backend team and add `safeHttpUrl`.

## Notes on process

The skill's full-audit pipeline (sub-agent hunter waves, JSON ledger and findings validators) was not run. For a codebase this size I did a direct source review and wrote this single report. `audits/` is not in `.gitignore`; add it if you don't want these reports committed.
