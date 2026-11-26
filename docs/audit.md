# Security fix plan

Source: `audits/REPORT.md` (audit of 2026-11-27, commit `a12e930`). Order: **fix now (frontend)**, then **hardening**, then **backend** last.

---

## Fix now — frontend

### 1. Open redirect after login (F1, confirmed, low)

**Case.**

1. The attacker sends an admin this link: `https://<admin>/login?next=%2F.%2F%2Fevil.com`.
2. The admin enters their phone and the real SMS code on the genuine domain.
3. `safeNext()` sees a same-origin URL. URL normalisation turns `/.//evil.com` into the pathname `//evil.com`, and `safeNext` returns that string.
4. `router.replace('//evil.com')` resolves to `https://evil.com/`. Next marks it external and does `location.replace`, so the admin leaves the panel.
5. `evil.com` shows a copy of the panel with "session expired, enter the new code". The attacker requests a fresh OTP for the admin's phone, the admin types it in, and the attacker logs in as that admin.

The same bypass works with `/..//`, `/%2e//` and `/./\`.

**Where.** [src/features/auth-otp/login-form.tsx:35-47](../src/features/auth-otp/login-form.tsx#L35-L47)

**Fix.** Move the function to `src/shared/lib/url.ts` (pure, so Vitest can test it) and reject any normalised path that doesn't start with exactly one `/`:

```ts
// src/shared/lib/url.ts
/** Same-origin path to go to after login, or `fallback`. Never a `//host` URL. */
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
		// After normalisation `/.//x` becomes pathname `//x` — a protocol-relative URL.
		if (u.origin !== origin || isLogin || !/^\/(?![/\\])/.test(u.pathname)) return fallback;
		return u.pathname + u.search + u.hash;
	} catch {
		return fallback;
	}
}
```

In `login-form.tsx`: `router.replace(safeNextPath(sp.get('next'), window.location.origin, routes.overview, routes.login))`, and delete the local `safeNext`.

**Test.** Add `src/shared/lib/url.test.ts`. Each of `/.//evil.com`, `/..//evil.com`, `/%2e//evil.com`, `/./\evil.com`, `//evil.com`, `https://evil.com`, `/login` and `/login/x` must return the fallback. `/masters?status=PENDING#x` must come back unchanged.

---

### 2. Proxy serves backend documents on the admin origin (F2, needs validation)

**Case.** `/api/v1/*` responses are served from the admin origin with the backend's `content-type`, and the page CSP allows inline scripts. Suppose any backend endpoint ever returns HTML or SVG that a customer or master can influence: an uploaded file, a reflected error page, a future export. An admin who opens that `/api/v1/...` URL then runs the attacker's script on the admin origin. The script calls `POST /api/session/refresh` (same-origin, so the cookie is sent), reads the access token, and acts as that admin. Today only the fixed icon set (`/public/catalog/icons/{key}.svg`) returns a renderable type, so this is a latent risk, not a live one.

**Where.** [src/shared/api/backend.server.ts:83-91](../src/shared/api/backend.server.ts#L83-L91), [next.config.ts](../next.config.ts)

**Fix.** Give API responses their own strict CSP. In `next.config.ts`, add a second rule **after** the `/:path*` one; Next lets the last matching rule override the same key:

```ts
{
	source: '/api/:path*',
	headers: [
		{ key: 'Content-Security-Policy', value: "default-src 'none'; sandbox; frame-ancestors 'none'" },
	],
},
```

JSON clients ignore CSP, and `<img src="/api/v1/...svg">` still renders, because images never run scripts. A directly opened document is sandboxed and can't run scripts.

**Test.** After `npm run build && npm start`, run `curl -sI localhost:4010/api/health`. It must show the API CSP above, while `/login` keeps the page CSP. Add a Playwright assertion on the header if you want it locked in.

---

### 3. Backend sees the Next server's IP for every admin request (F3, needs validation, needs backend coordination)

**Case.** The backend rate-limits OTP per phone **and per IP**. All traffic through this panel reaches the backend from the Next server's IP: `POST /api/v1/auth/otp/request` and the `/api/session` login. The proxy is open to anyone, so:

1. A script sends `POST https://<admin>/api/v1/auth/otp/request` with random numbers, a few dozen times.
2. The backend's per-IP bucket for "the Next server" fills up.
3. Every real admin now gets `429` on the login screen until the window resets, so nobody can log in to the panel.

Backend logs also record one IP for every admin action, which breaks incident investigation.

**Where.** `FORWARD_HEADERS` in [src/app/api/v1/[...path]/route.ts:19](../src/app/api/v1/[...path]/route.ts#L19), `backendFetch` in [src/shared/api/backend.server.ts:58](../src/shared/api/backend.server.ts#L58), [src/app/api/session/route.ts](../src/app/api/session/route.ts)

**Fix (frontend part).** Pass the real client IP to the backend in one header, taken from the hosting edge and never trusted from the client:

- Add a helper `clientIp(req)` in `backend.server.ts`. It returns the **right-most** entry of `x-forwarded-for`, the one the platform's proxy (Render or the load balancer) appended. If the header is absent, it returns nothing.
- `backendFetch` takes an optional `clientIp` and sets `X-Forwarded-For: <ip>`. It **replaces** the header rather than appending the client's chain.
- Pass it from the `/api/v1` proxy and from `POST /api/session`.

Do **not** ship this until B1 is done. If the backend trusts `X-Forwarded-For` from anywhere, forwarding it lets attackers spoof their IP and dodge limits.

**Test.** Unit-test `clientIp()` for these cases: no header, a single IP, and `"spoofed, real"` (must return `real`). Then do a manual check with the backend team that its logs show the browser IP.

---

## Hardening — frontend (cheap, do when convenient)

| #   | What                                   | Where                                                      | Change                                                                                                                                                                                               |
| --- | -------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1  | Login/logout CSRF                      | `src/app/api/session/route.ts`, `session/refresh/route.ts` | Reject `POST`/`DELETE` unless `sec-fetch-site` is `same-origin` (fall back to an `Origin` = host check), returning `403`.                                                                            |
| H2  | Cookie tossing from sibling subdomains | `src/shared/config/env.ts:11`, `backend.server.ts:117`     | In production, name the cookie `__Host-usta_rt` (needs `secure`, `path=/`, no `Domain`). Keep `usta_rt` for http dev. Update `src/proxy.ts` and the e2e mock. Existing sessions get logged out once. |
| H3  | Raw `<a href>` for chat images         | `src/widgets/order-detail/chat-viewer.tsx:86`              | Use `ExternalLink` like the other media widgets.                                                                                                                                                     |
| H4  | Unencoded route ids in API paths       | `src/entities/*/api.ts`                                    | Wrap ids in `encodeURIComponent(id)`.                                                                                                                                                                |
| H5  | `'unsafe-inline'` in `script-src`      | `next.config.ts:12`                                        | Keep (needed for PPR); revisit when Next supports hash-based CSP for prerendered pages.                                                                                                              |

---

## Backend (out of this repo — send to the backend team)

| #   | Problem and case                                                                                                                                                                                                                                             | What to do                                                                                                                                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | **Trusted client IP.** The admin panel will forward the real IP in `X-Forwarded-For` (fix 3). If the backend trusts that header from any caller, anyone can spoof it.                                                                                        | Trust `X-Forwarded-For` only from the admin server / platform proxy. Key per-IP limits (OTP request/verify) on the resolved client IP. Log it with every admin action.                                                                                                           |
| B2  | **Locking an admin out by phone number.** The limits are 10 SMS/day and 15 wrong codes/day **per number**. Anyone who knows an admin's phone can send `otp/request` 10 times, or `otp/verify` with 15 wrong codes, and that admin can't log in for 24 hours. | Don't let a stranger spend the admin's quota. Add a per-IP/per-device wrong-code counter so bad attempts from one source block only that source, or give `ADMIN_PHONES` a separate, unlock-able counter. Alert when an admin number hits its limit.                              |
| B3  | **Permissions are enforced only in the UI.** The panel hides menus and buttons (`nav.ts`, `useAccess`), but any admin token can call any `/admin/**` endpoint directly.                                                                                      | Confirm that every `/admin/**` endpoint checks the matching permission (`USERS`, `MASTERS`, `CATALOG`, `ORDERS`, `FINANCE`, `COMPLAINTS`, `SYSTEM`, `DELETE`) server-side. Add a test per permission, especially finance settle/close, invoices close, reindex and outbox retry. |
| B4  | **Non-JSON responses on `/api/v1`.** The admin proxy re-serves them on the admin origin (fix 2).                                                                                                                                                             | Keep `/api/v1` JSON / problem+json only. Never return user-uploaded bytes or HTML from it; serve files from storage via presigned URLs.                                                                                                                                          |
| B5  | **Session lifetime after logout/block.** Logout and block revoke only the refresh token, so a stolen access token keeps working until it expires. Presigned passport/document URLs work for anyone holding the link.                                         | Keep the access-token TTL short (≤ 15 min). Check `USER_BLOCKED` on every request (`TOKEN_OUTDATED` already exists). Keep presigned document URLs short-lived and send `Content-Disposition: attachment` for non-image documents.                                                |
