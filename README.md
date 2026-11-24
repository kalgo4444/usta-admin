# Usta Admin

Admin dashboard for the Usta platform — implementation of [`docs/index.md`](docs/index.md).

## Run

```bash
cp .env.example .env      # API_URL = backend origin (server-only)
npm install
npm run dev               # http://localhost:3000
```

| Script                                  |                                                             |
| --------------------------------------- | ----------------------------------------------------------- |
| `npm run dev` / `build` / `start`       | Next.js                                                     |
| `npm run lint` · `typecheck` · `format` | ESLint · tsc · Prettier                                     |
| `npm run gen:api`                       | Regenerate `src/shared/api/schema.d.ts` from `/v3/api-docs` |

Login is SMS OTP; only users with the `ADMIN` role (backend `ADMIN_PHONES`) get in.

## How it talks to the backend

The backend rejects browser CORS preflights, so the browser never calls it directly:

- `src/app/api/v1/[...path]` — same-origin proxy for every `/api/v1/*` call.
- `src/app/api/session` — OTP verify (login), `refresh`, logout. The rotating **refresh
  token lives only in an httpOnly cookie** (`usta_rt`); the access token stays in memory
  (plan §5, variant A). Token endpoints are not reachable through the generic proxy.
- `src/shared/api/session.ts` — single-flight refresh (+ Web Locks across tabs), proactive
  refresh 30 s before expiry, 401 → refresh once → retry.
- `src/proxy.ts` — redirects to `/login` when there is no refresh cookie.
- Requests pending > 4 s show the "server is waking up" banner (Render cold start);
  network/5xx-edge errors are retried twice.

## Structure (FSD)

```
src/app        routes (thin server components → <Suspense><View/></Suspense>), route handlers
src/views      page compositions (FSD "pages" layer; named views to avoid Next's pages/ dir)
src/widgets    app shell, overview widgets, order/master detail blocks, shared tables
src/features   auth-otp, block-user, verify-master, resolve-dispute, complaint-actions,
               category-form, service-form, settle-invoice, close-weeks, reindex, select-master, preferences
src/entities   query hooks + API calls per domain (query keys per plan §8)
src/shared     api client, i18n (uz/ru), ui kit (shadcn-style on radix-ui), DataTable, helpers
```

UI follows `DESIGN.md` (single blue accent, pill controls, 24 px cards, mono numerals).

## Deviations from the plan

- **Charts (Recharts)** not added — there is no time-series endpoint yet (plan §12 #6).
- **Map** uses an OpenStreetMap embed instead of Leaflet (one read-only marker).
- **Master search** (pickers, finance) is client-side over `/admin/masters` pages of 100 —
  the endpoint has no name filter.
- `components.json`/shadcn CLI not used; equivalent components live in `src/shared/ui/kit`.
