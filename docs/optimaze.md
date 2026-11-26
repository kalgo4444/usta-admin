# Production Optimization & Codebase Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the Next.js production checklist to usta-admin, enforce FSD import/export rules with public APIs per slice, and remove the duplication and dead code found in the audit, without changing behaviour.

**Architecture:** Each slice in `entities` / `features` / `widgets` / `views` gets an `index.ts` public API. ESLint `no-restricted-imports` (built in, no new package) blocks deep imports and imports that go up a layer. Production work is gated on measurement: take a bundle snapshot (`next analyze`) before and after, and keep only the changes that move the numbers.

**Tech Stack:** Next 16.4.6 (App Router, `cacheComponents`, React Compiler, Turbopack), React 19.3, TanStack Query 5 / Table 9, next-intl 4, RHF + zod 4, Vitest 5, Playwright.

**Spec:** this document. Sources: `node_modules/next/dist/docs/01-app/02-guides/production-checklist.md` (the same page as https://nextjs.org/docs/app/guides/production-checklist, but for the installed version), `node_modules/next/dist/docs/01-app/02-guides/package-bundling.md`, `AGENTS.md`.

---

## Audit summary (state at commit `61c5f97`)

`lint` and `typecheck` pass, and the layering is mostly correct. Findings:

| #   | Area           | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Where                                                                                                                                                                                                                                             |
| --- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Imports        | No slice public API: every consumer deep-imports files (`@/entities/catalog/api`, `@/views/masters/masters-page`). Nothing enforces layer direction.                                                                                                                                                                                                                                                                                                             | all of `src/`                                                                                                                                                                                                                                     |
| A2  | FSD violation  | One feature imports another: `category-form` and `service-form` import `features/catalog-media`.                                                                                                                                                                                                                                                                                                                                                                 | `features/category-form/category-form-dialog.tsx:21`, `features/service-form/service-form-dialog.tsx:20`                                                                                                                                          |
| A3  | Duplication    | The two catalog form dialogs (324 and 347 lines) repeat the slug/sortOrder/status/icon schema, the slug field with the "generate" button, the status select and the icon-omit rule.                                                                                                                                                                                                                                                                              | same two files                                                                                                                                                                                                                                    |
| A4  | Dead code      | `bun.lock` is already gone but `AGENTS.md` still mentions it. `/* config options here */` is left in `next.config.ts`. About 18 i18n keys are unused (e.g. `common.appName`, `common.filterActive`, `auth.countries.*`, `finance.periodHint`, `finance.run`, `masters.presets`). Some symbols are exported but used only in their own file (`*Params` types, `NavGroup`, `MediaSlot`, `DEFAULT_LOCALE`, `MAX_BODY_BYTES`, `TableFeatureSet`, `tableFeatureSet`). | various                                                                                                                                                                                                                                           |
| A5  | React Compiler | `reactCompiler: true` is on, but there are still 19 `useMemo` and 1 `useCallback` in 8 files, plus 2 `eslint-disable react-hooks/exhaustive-deps`.                                                                                                                                                                                                                                                                                                               | `features/category-form`, `features/service-form`, `features/select-master/master-picker.tsx`, `shared/lib/use-table-params.ts`, `shared/ui/filter-bar.tsx`, `views/catalog/*`, `widgets/order-detail/chat-viewer.tsx`, `entities/catalog/ui.tsx` |
| A6  | Images         | 10 raw `<img>` tags for presigned URLs, each with its own `eslint-disable @next/next/no-img-element`, and none has `loading`/`decoding`.                                                                                                                                                                                                                                                                                                                         | `entities/catalog/ui.tsx`, `features/catalog-media`, `views/catalog/services-page.tsx`, `widgets/master-detail/*`, `widgets/order-detail/*`                                                                                                       |
| A7  | Error UI       | Only `(dashboard)` has `error.tsx`. A crash on `/login` goes to `global-error.tsx`, which replaces the whole document and has no i18n.                                                                                                                                                                                                                                                                                                                           | `src/app/(auth)/`                                                                                                                                                                                                                                 |
| A8  | Bundle         | Dialogs with RHF + zod are always bundled into list pages, even though they render only after a click. Nothing has been measured yet.                                                                                                                                                                                                                                                                                                                            | `views/catalog/*`, `views/finance/invoices-page.tsx`, `views/admins/admins-page.tsx`, complaint/master detail                                                                                                                                     |
| A9  | i18n safety    | `AGENTS.md` requires `ru.json` to match `uz.json` key for key, but no test checks it.                                                                                                                                                                                                                                                                                                                                                                            | `src/shared/i18n/messages/`                                                                                                                                                                                                                       |

### Checklist items that are already covered or don't apply (no task)

- **Already covered:** layouts with partial rendering, `<Link>` in the nav, `global-error.tsx`, `not-found.tsx`, Suspense around request-time APIs, `next/font` (Inter + JetBrains Mono), static CSP header, `.env*` git-ignored, `API_URL` kept server-only, `robots: noindex` metadata, the TS plugin, `jsx-a11y` (via `eslint-config-next/core-web-vitals`), `output: 'standalone'`, and Docker running as a non-root user.
- **Server Components for data / Server Actions / taint / Data Access Layer:** don't apply. The access token lives only in browser memory (`session.ts`) by design, so data has to be fetched on the client. The only server code is the proxy and the session route handlers.
- **`next/image`:** rejected. URLs are presigned and expire (`AGENTS.md` gotcha). The optimizer would cache them by URL and would need `remotePatterns` for the storage host. Task 5 fixes the `<img>` tags instead.
- **`useReportWebVitals`:** rejected. There's no analytics endpoint to send data to. Use Lighthouse manually (Task 8).
- **Lazy-loading the `ru.json` locale:** rejected. It's 23 KB raw, about 5 KB gzipped, and lazy loading would add an async step to the locale switch.
- **`experimental.optimizePackageImports: ['radix-ui']`:** not needed. `radix-ui` declares `"sideEffects": false`, so production builds already tree-shake it, and `lucide-react` is in Next's default list.
- **Sitemaps / OG images:** don't apply. This is a private admin panel.

## Global Constraints

- No new npm packages. Use ESLint's built-in `no-restricted-imports`, `next analyze` (bundled with Next ≥ 16.1), and `npx knip` only as a one-off run that isn't saved to `package.json`.
- No behaviour change. Every existing Vitest and Playwright test must pass unchanged, except for import paths.
- TypeScript strict, no new `any`. Don't edit `src/shared/api/schema.d.ts`.
- Imports flow `shared → entities → features → widgets → views → app`, downward only. Slices on the same layer never import each other.
- Inside a slice, use relative imports (`./api`). Across slices, import only from the public API (`@/entities/catalog`). A slice never imports its own barrel.
- `shared` gets no barrels. Keep per-module paths (`@/shared/ui/kit/button`, `@/shared/api/client`) so one huge barrel doesn't pull everything into every chunk.
- Barrels never re-export server-only code. `shared/api/backend.server.ts` (which imports `server-only`) stays reachable only from `src/app/api/**`.
- Presigned-media queries keep `staleTime: 0` / `gcTime: 0`.
- `ru.json` stays key-for-key identical to `uz.json`.
- Bump `package.json` `version` at the end (AGENTS.md: "Every big change…"). It is currently `1.1.0`, uncommitted; release as `1.2.0`.
- After every task, run `npm run lint && npm run typecheck && npm test`. Tasks 2, 4, 5, 6 and 7 also need `npm run build && npm run test:e2e`.

## Review Focus

1. **A barrel pulls a heavy or server-only module into a client chunk.** Expected: the `/login` chunk doesn't grow after Task 1. _Pinned by:_ the Task 0 snapshot compared against Task 1 (`next analyze` diff) and `npm run build`, which fails if `server-only` ends up in a client graph.
2. **Circular import through a barrel** (e.g. `entities/catalog/ui.tsx` → `@/entities/catalog` → `ui.tsx`), which shows up as `undefined` at runtime. Expected: the lint rule rejects any self-barrel import. _Pinned by:_ the Task 1 ESLint rule plus a fixture check in Task 1, step 4.
3. **Saving a catalog item that has an uploaded icon** while the `icon` key is unchanged. Expected: `icon` is omitted from the body, so the uploaded icon is kept. _Pinned by:_ the `iconForSave` tests in Task 3.
4. **Removing `useMemo` from a value that feeds an effect or a query key**, causing a render loop or refetch storm. Expected: the number of list-page requests stays the same. _Pinned by:_ the e2e request-count assertion in Task 4.
5. **i18n key removal misses a dynamic key** (``t(`x.${v}`)``), so the UI shows a raw key. Expected: no removed key is reachable. _Pinned by:_ the dynamic-key grep in Task 6, step 1, and the parity test in Task 6.

---

## File map

| Path                                                       | Action             | Responsibility                                                                                       |
| ---------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------- |
| `src/{entities,features,widgets,views}/<slice>/index.ts`   | Create (≈37 files) | Slice public API: named re-exports only                                                              |
| `eslint.config.mjs`                                        | Modify             | Layer direction, no deep imports, no cross-slice imports                                             |
| `src/features/catalog-form/`                               | Create             | Merges `category-form`, `service-form`, `catalog-media` plus the shared `fields.tsx` and `schema.ts` |
| `src/features/{category-form,service-form,catalog-media}/` | Delete             | Replaced by `catalog-form`                                                                           |
| `src/entities/catalog/model.ts`                            | Modify             | Add `iconForSave`                                                                                    |
| `src/entities/catalog/model.test.ts`                       | Create             | Tests for `iconForSave`                                                                              |
| `src/features/catalog-form/schema.test.ts`                 | Create             | Tests for the shared field schema                                                                    |
| `src/shared/ui/remote-image.tsx`                           | Create             | The single `<img>` wrapper for presigned URLs                                                        |
| `src/app/(auth)/error.tsx`                                 | Create             | Localised error boundary for `/login`                                                                |
| `src/app/robots.ts`                                        | Create             | `Disallow: /`                                                                                        |
| `src/shared/i18n/messages.test.ts`                         | Create             | Key parity between `uz.json` and `ru.json`                                                           |
| `next.config.ts`, `AGENTS.md`, `package.json`              | Modify             | Cleanup, documentation, version                                                                      |

---

### Task 0: Baseline measurement

**Files:** none committed (the output goes to `.next/diagnostics/analyze`, which is git-ignored).

- [ ] **Step 1:** Run `npm run build`. Expected: a successful build that lists all 21 routes.
- [ ] **Step 2:** Run `npx next analyze --output --snapshot before`, then `npx next analyze export --snapshot before > ../scratch-bundle-before.jsonl` (outside the repo). Expected: a JSONL file with per-route client chunk sizes.
- [ ] **Step 3:** Write down the client JS size for `/login`, `/catalog/categories`, `/catalog/services`, `/finance/invoices`, `/admins` and `/masters/[id]`, and how much of it is `zod` and `react-hook-form`. These numbers are the gate for Task 7.

### Task 1: Slice public APIs + import rules

**Files:**

- Create: `index.ts` in every slice folder under `src/entities/*`, `src/features/*`, `src/widgets/*`, `src/views/*`
- Modify: `eslint.config.mjs`
- Modify: every file that imports `@/entities|features|widgets|views/<slice>/<file>`, including `src/app/**/page.tsx`

**Interfaces:**

- Produces: import paths `@/entities/<slice>`, `@/features/<slice>`, `@/widgets/<slice>`, `@/views/<slice>`.

- [ ] **Step 1: Write the barrels.** Each `index.ts` contains only `export { A, B } from './file'` and `export type { T } from './file'`. Export only symbols that are imported from outside the slice today; find them with `grep -rn "from '@/entities/catalog/" src`. No `export *` and no `'use client'` in barrels: client components are re-exported as client references, so server `page.tsx` files can import them.
      Example, `src/entities/catalog/index.ts`:
  ```ts
  export { catalogApi, catalogKeys, useCatalogIcons /* … */ } from './api';
  export type { CatalogKind } from './api';
  export {
  	buildCategoryTree,
  	flattenTree,
  	localized,
  	selfAndDescendants,
  	SLUG_RE,
  	slugify,
  } from './model';
  export { CatalogIcon, IconPicker } from './ui';
  ```
- [ ] **Step 2: Rewrite imports** to the barrel paths (`@/views/masters`, `@/entities/user`, …). Within a slice, keep or switch to relative `./x` imports.
- [ ] **Step 3: Add the ESLint rules** in `eslint.config.mjs` as `files`-scoped blocks using `no-restricted-imports` → `patterns`:
  - all of `src/**`: forbid `@/entities/*/*`, `@/features/*/*`, `@/widgets/*/*`, `@/views/*/*` with the message "Import from the slice public API (index.ts)".
  - `src/shared/**`: forbid `@/entities*`, `@/features*`, `@/widgets*`, `@/views*`, `@/app*`.
  - `src/entities/**`: forbid `@/entities*` (use relative paths inside the slice), plus `@/features*`, `@/widgets*`, `@/views*`.
  - `src/features/**`: forbid `@/features*`, `@/widgets*`, `@/views*`.
  - `src/widgets/**`: forbid `@/widgets*`, `@/views*`.
  - `src/views/**`: forbid `@/views*`.
    Forbidding the whole own layer also forbids importing the slice's own barrel (Review Focus 2).
- [ ] **Step 4: Prove the rules fire.** Temporarily add `import { CatalogMedia } from '@/features/catalog-media';` to `src/features/category-form/category-form-dialog.tsx`, then run `npx eslint src/features/category-form`. Expected: one `no-restricted-imports` error. Revert the line. The existing A2 violation is still reported at this point; Task 2 fixes it, so list it as a known error, or land Task 2 first if you want lint green on every commit.
- [ ] **Step 5:** Run `npm run lint && npm run typecheck && npm test && npm run build`. Expected: everything passes except A2. Then run `npx next analyze --output --snapshot after-barrels` and compare `/login` with Task 0. Expected: no growth (Review Focus 1).
- [ ] **Step 6: Commit** with `refactor: add slice public APIs and enforce FSD import rules`.

### Task 2: Merge catalog features into `features/catalog-form` (fixes A2)

**Files:**

- Create: `src/features/catalog-form/{category-form-dialog.tsx,service-form-dialog.tsx,catalog-media.tsx,index.ts}` (moved with `git mv`)
- Delete: `src/features/{category-form,service-form,catalog-media}/`
- Modify: `src/views/catalog/categories-page.tsx`, `src/views/catalog/services-page.tsx`

**Interfaces:**

- Produces: `@/features/catalog-form` exports `CategoryFormDialog`, `ServiceFormDialog` (same props as today). `CatalogMedia` stays internal to the slice, so it is not exported.

- [ ] **Step 1:** Run `git mv` on the three files into `src/features/catalog-form/`, change `CatalogMedia` imports to `./catalog-media`, and write `index.ts`.
- [ ] **Step 2:** Update the two views to import from `@/features/catalog-form`.
- [ ] **Step 3:** Run `npm run lint`. Expected: 0 errors, A2 is gone.
- [ ] **Step 4:** Run `npm run build && npm run test:e2e`. Expected: PASS.
- [ ] **Step 5: Commit** with `refactor: merge catalog form features into one slice`.

### Task 3: De-duplicate the catalog form dialogs (fixes A3)

**Files:**

- Modify: `src/entities/catalog/model.ts`, `src/entities/catalog/index.ts`
- Create: `src/entities/catalog/model.test.ts`
- Create: `src/features/catalog-form/schema.ts`, `src/features/catalog-form/schema.test.ts`, `src/features/catalog-form/fields.tsx`
- Modify: `src/features/catalog-form/category-form-dialog.tsx`, `src/features/catalog-form/service-form-dialog.tsx`

**Interfaces:**

- Produces (entities): `iconForSave(value: string, original: string | undefined, customIcon: boolean): string | undefined`
- Produces (feature-internal):

  ```ts
  interface CatalogSchemaMessages {
  	required: string;
  	slugInvalid: string;
  	unknownIcon: string;
  	invalidNumber: string;
  	maxLength: (max: number) => string;
  }
  function catalogCommonFields(
  	m: CatalogSchemaMessages,
  	iconKeys: ReadonlySet<string> | null,
  ): {
  	slug: z.ZodString;
  	icon: z.ZodString;
  	sortOrder: z.ZodOptional<z.ZodNumber>;
  	status: z.ZodEnum<{ ACTIVE: 'ACTIVE'; INACTIVE: 'INACTIVE' }>;
  };
  function useCatalogSchemaMessages(): CatalogSchemaMessages; // wraps useTranslations('catalog'|'errors')
  function SlugField(props: {
  	form: UseFormReturn<{ slug: string }>;
  	source: () => string;
  	onManualEdit: () => void;
  	onRegenerate: () => void;
  	error?: string;
  }): JSX.Element;
  function StatusSelectField<T extends FieldValues>(props: {
  	control: Control<T>;
  	name: Path<T>;
  	hint?: string;
  }): JSX.Element;
  ```

  `iconKeys === null` means icons haven't loaded yet, and any key is accepted (today's `!icons.data` branch). Messages are passed in as resolved strings rather than as `t`, because next-intl's typed `t` won't assign to a plain `(key: string) => string`, and plain strings keep the schema testable in Vitest's node environment.

- [ ] **Step 1: Write the failing tests.**
      `src/entities/catalog/model.test.ts`, `describe('iconForSave')`:
  - `iconForSave('wrench', 'wrench', true)` → `undefined` (uploaded icon kept, Review Focus 3)
  - `iconForSave('drill', 'wrench', true)` → `'drill'`
  - `iconForSave('', undefined, false)` → `undefined`
  - `iconForSave('drill', undefined, false)` → `'drill'`

  `src/features/catalog-form/schema.test.ts`. Use `m` = stub messages (`required: 'req'`, `maxLength: n => 'max' + n`, …) and `z.object(catalogCommonFields(m, new Set(['wrench'])))`:
  - `{ slug: 'Bad Slug', icon: '', status: 'ACTIVE' }` fails with message `m.slugInvalid` on `slug`
  - `slug` of 81 chars fails with `'max80'`
  - `sortOrder: 100001` fails, `sortOrder: undefined` passes
  - `icon: 'nope'` fails with `m.unknownIcon`. With `iconKeys = null`, `icon: 'nope'` passes.
  - `{ slug: 'santexnika', icon: 'wrench', sortOrder: 0, status: 'INACTIVE' }` passes

- [ ] **Step 2:** Run `npx vitest run src/entities/catalog src/features/catalog-form`. Expected: FAIL (the modules don't exist yet).
- [ ] **Step 3:** Implement `iconForSave` in `model.ts` and export it from the barrel. Implement `catalogCommonFields` and `useCatalogSchemaMessages` in `schema.ts`, and `SlugField` and `StatusSelectField` in `fields.tsx`. Copy the markup from `category-form-dialog.tsx`: the slug input with `num` class, the `WandSparklesIcon` secondary icon button `size-12`, and the ACTIVE/INACTIVE `Select` labelled by `enumLabel('CatalogStatus', s)`.
- [ ] **Step 4:** Rewrite both dialogs to spread `...catalogCommonFields(messages, iconKeys)` into their `z.object`, to use `iconForSave(v.icon, original?.icon ?? undefined, customIcon)` in the request body, and to render `<SlugField>` and `<StatusSelectField>`. Keep the field ids (`c-slug` etc.) and the translation keys unchanged.
- [ ] **Step 5:** Run `npx vitest run src/entities/catalog src/features/catalog-form`. Expected: PASS. Then run `npm run lint && npm run typecheck`.
- [ ] **Step 6: Commit** with `refactor: share catalog form schema and fields`.

### Task 4: Let the React Compiler do the memoising (fixes A5)

**Files:** the 8 files listed in A5. Leave `src/shared/ui/data-table.tsx` alone (`'use no memo'`: the TanStack table instance is mutable).

- [ ] **Step 1: Write the failing e2e guard.** In `e2e/masters.spec.ts`, add the test `'list page does not refetch in a loop'`: open `/masters`, wait for the table, count `GET /api/v1/admin/masters*` requests over 2 s after load, and `expect(count).toBe(1)`. Add the same check for `/catalog/categories` (endpoint from `entities/catalog/api.ts`). It passes today. Its job is to catch a regression after the next step (Review Focus 4).
- [ ] **Step 2:** Remove every `useMemo` / `useCallback` in those files and inline the computation. Remove the `useMemo`/`useCallback` imports.
- [ ] **Step 3:** In `src/shared/lib/use-table-params.ts`, drop the `filterKey` join trick and its `eslint-disable`. Compute `values` and `apiFilters` straight from `sp` and `filters`. TanStack Query hashes query keys, so object identity doesn't matter.
- [ ] **Step 4:** In `src/shared/ui/filter-bar.tsx`, replace the "debounced value → effect → `onCommit`" pattern (and its `eslint-disable`) by committing from the input's `onChange` through a timeout ref that is cleared on each keystroke and on unmount. This is the "You Might Not Need an Effect" pattern. Keep the 400 ms delay and the `(x || undefined) !== (value || undefined)` guard. If `shared/lib/use-debounce.ts` has no other users afterwards, delete it.
- [ ] **Step 5:** Run `npm run lint`. Expected: 0 errors; the `react-compiler` rule confirms every touched component still compiles. Then run `npm run build && npm run test:e2e`. Expected: PASS, including the new request-count tests.
- [ ] **Step 6: Commit** with `refactor: drop manual memoisation covered by React Compiler`.

### Task 5: One presigned-image component (fixes A6)

**Files:**

- Create: `src/shared/ui/remote-image.tsx`
- Modify: the 10 `<img>` sites listed in A6

**Interfaces:**

- Produces: `RemoteImage(props: React.ComponentProps<'img'> & { eager?: boolean }): JSX.Element`. It renders `<img loading={eager ? 'eager' : 'lazy'} decoding='async' alt='' {...props} />`. Its only `eslint-disable-next-line @next/next/no-img-element` carries a comment explaining that presigned, expiring URLs can't go through the optimizer.

- [ ] **Step 1:** Create the component.
- [ ] **Step 2:** Replace every `<img>` and delete its `eslint-disable` comment. Pass `eager` to images that are visible as soon as they mount: the lightbox/current image in `documents-gallery.tsx:85`, the current preview in `catalog-media.tsx`, and `master-avatar.tsx`. Thumbnails in tables, galleries and chat stay lazy.
- [ ] **Step 3:** Run `grep -rn "<img" src | grep -v remote-image.tsx`. Expected: no output. Then run `npm run lint && npm run build && npm run test:e2e`. Expected: PASS.
- [ ] **Step 4: Commit** with `refactor: route presigned images through RemoteImage`.

### Task 6: Dead code, i18n parity, small checklist gaps (fixes A4, A7, A9)

**Files:**

- Create: `src/shared/i18n/messages.test.ts`, `src/app/(auth)/error.tsx`, `src/app/robots.ts`
- Modify: `src/shared/i18n/messages/{uz,ru}.json`, `next.config.ts`, `AGENTS.md`, the files exporting the in-file-only symbols from A4

- [ ] **Step 1: Write the parity test** `messages.test.ts` → `it('ru.json has exactly the keys of uz.json')`. Flatten both JSONs into dotted leaf paths and run `expect(sorted(ru)).toEqual(sorted(uz))`. Run `npx vitest run src/shared/i18n`. Expected: PASS today (it locks in the invariant).
- [ ] **Step 2: Find unused keys.** For each leaf key in `uz.json` outside `enums.*`, grep `src/` for the quoted last segment. Then check every dynamic call with `grep -rnE "t\(\`|t\([a-zA-Z]+[),]" src --include='_.tsx'`and keep any key such a call can reach (Review Focus 5). Expected candidates, to verify:`common.appName`, `common.search`, `common.back`, `common.copy`, `common.open`, `common.reset`, `common.filterActive`, `auth.countries._`, `masters.presets`, `finance.periodHint`, `finance.run`. Delete the verified keys from **both** files.
- [ ] **Step 3:** Run `npx vitest run src/shared/i18n && npm run typecheck`. Expected: PASS. The `uz.json` type drives `useTranslations`, so typecheck fails if a removed key is still used.
- [ ] **Step 4: Dead exports.** Run `npx knip --include exports,types` once (not saved). For symbols used only in their own file (`UsersParams`, `MastersParams`, `OrdersParams`, `ComplaintsParams`, `InvoicesParams`, `CommissionsParams`, `TransactionsParams`, `NavGroup`, `MediaSlot`, `DEFAULT_LOCALE`, `MAX_BODY_BYTES`, `TableFeatureSet`, `tableFeatureSet`), drop the `export` keyword. Keep the `*Keys` query-key objects exported: they are the invalidation API. Keep `onRequestError`: it's a Next convention.
- [ ] **Step 5: Error boundary.** Create `src/app/(auth)/error.tsx` (`'use client'`), the same as `src/app/(dashboard)/error.tsx` but wrapped in a centred `min-h-screen` container. It sits inside the root `Providers`, so `ErrorState` gets i18n.
- [ ] **Step 6: Robots.** Create `src/app/robots.ts` that returns `{ rules: { userAgent: '*', disallow: '/' } }` (type `MetadataRoute.Robots`). This backs up the `noindex` meta for crawlers that fetch `/robots.txt`.
- [ ] **Step 7: Leftovers.** Remove `/* config options here */` from `next.config.ts`. In `AGENTS.md`, delete "`bun.lock` is stale" (the file no longer exists).
- [ ] **Step 8:** Run `npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e`. Expected: PASS, and `curl -s localhost:4020/robots.txt` (with `next start` running) prints `Disallow: /`.
- [ ] **Step 9: Commit** with `chore: remove dead code and unused i18n keys, add auth error boundary and robots`.

### Task 7: Lazy-load click-only dialogs (A8, measurement-gated)

Do this task **only if** Task 0 shows `zod` + `react-hook-form` + the dialog modules add **≥ 15 KB gzipped** to a list page's client JS. Otherwise record the numbers in the PR and skip it.

**Files:** `src/views/catalog/{categories,services}-page.tsx`, `src/views/finance/invoices-page.tsx`, `src/views/admins/admins-page.tsx`, plus the detail views that open `ResolveDisputeDialog`, `SettleInvoiceDialog` and `AdminFormDialog` (`grep -rn "Dialog " src/views`).

- [ ] **Step 1:** In each view, load the dialog with `const XDialog = dynamic(() => import('@/features/x').then(m => m.XDialog))` (`next/dynamic`, the lazy-loading guide), and render it only after it has been opened once: `const [mounted, setMounted] = useState(false)`, set to `true` in the open handler, and `{mounted && <XDialog open={open} … />}`. Mounting once keeps the close animation and avoids re-fetching the chunk.
- [ ] **Step 2:** Run `npm run build && npx next analyze --output --snapshot after`. Expected: the list routes' initial client JS drops by the amount measured in Task 0, and `/login` doesn't change.
- [ ] **Step 3:** Run `npm run test:e2e`. Expected: PASS (dialog-opening tests cover the async load).
- [ ] **Step 4: Commit** with `perf: lazy-load form dialogs on first open`.

### Task 8: Final verification, docs, version

**Files:** `AGENTS.md`, `package.json`

- [ ] **Step 1:** In `AGENTS.md` → "Layering", add: "Each slice exposes an `index.ts` public API; import other slices only through it (`@/entities/catalog`), use relative imports inside a slice, and never import a sibling slice on the same layer. `shared` has no barrels. ESLint enforces this (`no-restricted-imports` in `eslint.config.mjs`)." Also name `features/catalog-form` where the catalog gotchas mention the forms, and `RemoteImage` next to the presigned-URL gotcha.
- [ ] **Step 2:** Set `package.json` `version` to `1.2.0`.
- [ ] **Step 3:** Run `npm run format && npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e`. Expected: everything passes.
- [ ] **Step 4:** Run `npm start`, then Lighthouse in an incognito window on `/login` and on `/` (with a mocked or real session). Record Performance, Accessibility and Best Practices scores in the PR. Fix any Accessibility finding below 100 that is in our own markup.
- [ ] **Step 5: Commit** with `docs: document slice public APIs; bump version to 1.2.0`.

---

## Target structure (after the plan)

```
src/
  app/                 routes only: thin server pages, layouts, error/not-found, robots.ts, api/
  views/<page>/        index.ts + <page>-page.tsx
  widgets/<block>/     index.ts + components
  features/<action>/   index.ts + dialog/form (+ schema.ts, fields.tsx when shared inside the slice)
    catalog-form/      category-form-dialog, service-form-dialog, catalog-media, schema, fields
  entities/<domain>/   index.ts + api.ts (queries, keys, api object) + model.ts (pure) + ui.tsx
  shared/              no barrels; api/ config/ i18n/ lib/ ui/ ui/kit/
```
