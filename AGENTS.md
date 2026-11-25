# AGENTS.md

Admin dashboard for the Usta platform (Next.js 16 App Router, React 19, TypeScript, Tailwind 4). The product spec is `docs/index.md` (Uzbek); UI rules are in `DESIGN.md` (single blue accent, pill controls, 24px cards, monospace numerals via the `num` utility). `AGENTS.md` warns that this Next.js version has breaking changes — read `node_modules/next/dist/docs/` before relying on memory of Next APIs.

## Commands

```bash
npm run dev          # next dev (needs .env: API_URL=<backend origin>, see .env.example)
npm run build        # production build — the real check for cacheComponents/Suspense errors
npm run lint         # eslint (react-hooks/refs and react-compiler rules are errors)
npm run typecheck    # tsc --noEmit
npm run format       # prettier (tailwind class sorting)
npm run gen:api      # regenerate src/shared/api/schema.d.ts from the live /v3/api-docs
```

Docker: `docker compose up --build` serves the standalone Next build on `${PORT:-4010}`; `API_URL` is a runtime, server-only env var (empty falls back to the default in `src/shared/config/env.ts`).

There is no test runner configured. npm is the package manager (`package-lock.json`); `bun.lock` is stale.

If `tsc`/`build` fails on `.next/dev/types/validator.ts` referencing deleted routes, delete the stale files in `.next/dev/types/` (the project denies `rm -rf`, so remove the files individually).

## Architecture

- `src/app/api/v1/[...path]/route.ts` proxies all `/api/v1/*` calls; `auth/otp/verify`, `auth/refresh`, `auth/logout` are deliberately blocked there.
- `src/app/api/session/` (login/logout) and `session/refresh/` handle tokens. The backend **rotates the refresh token on every refresh**, so the refresh token lives only in an httpOnly cookie (`usta_rt`) and the access token only in memory (`src/shared/api/session.ts`).
- `session.ts` makes refresh single-flight (shared promise + Web Locks across tabs) and refreshes proactively 30 s before expiry. `client.ts` (axios) attaches the token, retries once after a 401 refresh, and normalises RFC 9457 `problem+json` errors into `ApiError` (`errors.ts`).
- `src/proxy.ts` (Next 16's renamed middleware) only checks for the cookie and redirects to `/login?next=…`; real ADMIN authorization is `AdminShell` (`GET /me` must return an ACTIVE user with role ADMIN) plus the backend.
- Requests pending > 4 s drive the "server waking up" banner (`server-status.ts`); only network/502-504 errors are retried (2×, see `app/providers.tsx`).

**Layering (FSD-style).** `shared` → `entities` → `features` → `widgets` → `views` → `app`; import only downward.

- `src/app`: routes are thin server components that render `<Suspense><XPage/></Suspense>`. With `cacheComponents: true`, anything using `useSearchParams`/`useParams` must sit under Suspense or `next build` fails (dev won't catch it).
- `src/views` holds the page compositions (named `views`, not `pages`, to avoid Next's `pages/` dir).
- `src/entities/<domain>/api.ts`: TanStack Query hooks + plain API objects. Query keys follow `['admin', <resource>, params]`; mutations call `invalidate()` (`shared/api/invalidate.ts`), which also invalidates the `['admin','count']` KPI counters. Errors from mutations go through `useMutationErrorHandler` (409 → toast + refetch all `admin` queries).
- `src/features`: one folder per user action (dialogs/forms with RHF + zod). `shared/ui`: `DataTable`, `ReasonDialog`, `ConfirmDialog`, `StatusBadge`, filters. `shared/ui/kit`: hand-written shadcn-style primitives on `radix-ui` (the shadcn CLI is not used).

**Types.** `src/shared/api/schema.d.ts` is generated — don't edit. Use the aliases in `shared/api/types.ts` (and `ENUMS` there, which is type-checked against the schema).

**List pages.** `useTableParams` (`shared/lib`) keeps page (zero-based, like the API), size, sort (`field,DIR`) and filters in the URL; `DataTable` is server-side sorted/paged (TanStack Table v9 — `useTable`, `tableFeatures`, `table.FlexRender`, not the v8 API). Overview KPIs have no stats endpoint: they use `totalElements` from `size=1` list queries (`useCount`).

**i18n.** next-intl without routing: locale (`uz` default, `ru`) is client-side in `localStorage` (`shared/i18n/locale.ts`) and also sent as `Accept-Language`; changing it invalidates all queries. Messages are in `shared/i18n/messages/{uz,ru}.json` — `uz.json` defines the type (`src/global.d.ts`), so keep `ru.json` key-for-key identical. Enum labels come from `enums.*` via `useEnumLabel`; colours from `shared/lib/status.ts`.

## Gotchas

- Master document, portfolio and order attachment URLs are presigned and expire: those queries use `staleTime: 0` / `gcTime: 0` — don't add caching.
- `/admin/masters` has no name filter; the master picker and finance name lookups search client-side over the paged directory (`useMasterDirectory`).
- Catalog items are never deleted, only set `INACTIVE`. ADMIN users can't be blocked (the Block button is hidden).
- `react-hook-form`'s `watch()` breaks the React Compiler lint rule — use `useWatch`. Form dialogs are split so the form component mounts per open (fresh defaults instead of reset effects); avoid reading refs during render.
- `DataTable` uses `"use no memo"` because the TanStack table instance is mutable.
- The OTP flow can't be exercised without a real admin phone (`ADMIN_PHONES` on the backend); for UI work, mock `/api/session/refresh` and `/api/v1/**` in the browser with a fake `usta_rt` cookie.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
