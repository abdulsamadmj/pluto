# Pluto — Warranty & Device Tracker

A full-stack web application for cataloging electronic devices, tracking warranty
coverage, and getting ahead of upcoming expirations from a centralized dashboard.

Built on the **[Reno Stack](https://github.com/reno-stack/reno-stack)** for
**end-to-end type safety** — a single type definition flows unbroken from the
PostgreSQL schema through the API to the rendered table cell.

---

## ✨ Highlights

- **Marketing landing page** — hero, features, statistics, and call-to-action.
- **Full auth flow** — sign in, sign up, forgot password, reset password
  (real, type-safe sessions via Better-Auth; email/password).
- **Dashboard** — summary metrics + a feature-rich device table with
  **search, filtering, sorting, pagination, loading states, and empty states**,
  all driven server-side and reflected in the URL.
- **Device details** — full profile with purchase/warranty info, an expiry
  countdown with coverage progress bar, a warranty timeline, and editable notes.
- **Device CRUD** — create (bottom sheet), edit (dedicated page), delete (warning
  dialog), plus a table/grid view toggle — on both web and mobile.
- **Companion mobile app** — a full Expo (React Native) app sharing the same
  Hono API, validators, and Better-Auth (native) — auth, list, details, CRUD.
- **Type-safe API** — Hono routes consumed through Hono RPC + React Query, so
  the client never hand-writes a fetch call or a response type.

---

## ✅ Assignment Coverage

Every requirement from the brief, mapped to where it lives in the code.

### Front-end

| Requirement | Status | Where |
| ----------- | ------ | ----- |
| Landing — hero section | ✅ | `apps/web/src/routes/index.tsx` (`Hero`) |
| Landing — product features | ✅ | `Chapter` panels + `MobileAppSection` |
| Landing — statistics section | ✅ | `Stats` (animated count-up) |
| Landing — call-to-action | ✅ | `CallToAction` + nav "Get started" |
| Landing — responsive | ✅ | Dedicated `MobileLanding` for small viewports |
| Auth — sign in | ✅ | `routes/sign-in.tsx` |
| Auth — sign up | ✅ | `routes/sign-up.tsx` |
| Auth — forgot password | ✅ | `routes/forgot-password.tsx` |
| Auth — reset password | ✅ | `routes/reset-password.tsx` |
| Auth — validation & error handling | ✅ | Zod schemas (`lib/auth-schemas.ts`) + inline form errors |
| Dashboard — summary metrics (Total / Active / Expiring Soon / Expired) | ✅ | `dashboard.tsx` (`MetricCards`) ← `GET /stats` |
| Dashboard — device table (Name, Brand, Purchase Date, Warranty Expiry, Status, Actions) | ✅ | `dashboard.tsx` (`DeviceTable`) |
| Dashboard — search / filter / sort / pagination | ✅ | URL-driven, executed server-side in `devices.service.ts` |
| Dashboard — loading & empty states | ✅ | `LoadingRows` (skeletons), `EmptyState`, + error state |
| Device details — info, brand, purchase, warranty, expiry | ✅ | `routes/devices.$id.index.tsx` |
| Device details — warranty timeline / history | ✅ | `warranty_event` table → details timeline |
| Device details — notes section | ✅ | Editable notes (`PATCH /devices/:id/notes`) |

### Back-end / API

| Requirement | Status | Where |
| ----------- | ------ | ----- |
| API layer (Node; any framework) | ✅ | Hono on Node — `apps/server` |
| Device listing endpoint | ✅ | `GET /devices` |
| Device details endpoint | ✅ | `GET /devices/:id` |
| Pagination / search / filter / sort | ✅ | `devices.service.ts` (Drizzle, all in SQL) |
| Dummy data source | ✅ | `db/seed.ts` (~250 Faker devices) |

### Beyond the brief

- **Companion Expo mobile app** sharing the same API, validators, and auth.
- **Real (not mocked) authentication** with sessions and a route guard.
- **Full device CRUD** (create / edit / delete) on web **and** mobile.
- **Warranty-expiry notifications** with an unread badge.
- **Table ⇄ grid view toggle** with shareable URL state.
- **Scroll-driven 3D landing hero** (React Three Fiber) with graceful fallbacks.

---

## 🧱 Tech Stack

| Layer        | Technology | Why |
| ------------ | ---------- | --- |
| Front-end    | React 19 + Vite, TanStack Router (file-based, typed search params), TanStack Query | Typed routing + URL-as-state; Query handles caching, loading/error states, and mutations |
| UI / styling | Tailwind CSS, Shadcn UI (Radix primitives), Lucide icons | Accessible component primitives + a consistent dark design system |
| Landing visuals | React Three Fiber (`three`), Framer Motion | Scroll-choreographed 3D phone + section reveals, with reduced-motion/WebGL fallbacks |
| Type-safe API client | Hono RPC + [`@reno-stack/hono-react-query`](https://github.com/reno-stack/hono-react-query) | Server route types flow into the client; no hand-written `fetch` or response types |
| Back-end     | Hono (on Node via `@hono/node-server`), Drizzle ORM, PostgreSQL | Web-standard, ultralight router that exposes an RPC type; SQL-first typed ORM |
| Auth         | Better-Auth (email & password) | Real sessions (cookies on web, bearer tokens on native) with a route guard |
| Validation   | Zod schemas shared across client & server (`packages/validators`) | One contract validates requests **and** types inputs |
| Mobile       | Expo (React Native) + Expo Router, NativeWind | Companion app reusing the same API, validators, and auth |
| Seed data    | `@faker-js/faker` (~250 devices, deterministic seed) | Realistic, repeatable demo dataset |
| Tooling      | pnpm workspaces, Turborepo, TypeScript, ESLint, Prettier | Caching task runner across a shared-code monorepo |

---

## 🔒 End-to-End Type Safety

This is the core architectural property of the project:

```
Drizzle schema  →  inferred row types  →  shared Zod validators
      →  Hono route (validated)  →  Hono RPC client (hc<AppType>)
      →  React Query hook  →  UI
```

- **`apps/server/src/db/schema.ts`** defines the `device` table; its row type is
  inferred with `InferSelectModel` and used everywhere — no duplicated interface.
- **`packages/validators`** holds the `deviceQuerySchema` (search/filter/sort/
  pagination params) and the `getWarrantyStatus` helper. Both the Hono route
  (to validate requests) and the web app (to type inputs) import the same file.
- **`apps/server/src/app.ts`** exports `AppType = typeof app`. The web client is
  built with `hc<AppType>()`, so request shapes and JSON responses are inferred.
- **`apps/web/src/queries/devices.queries.ts`** wraps the RPC endpoints with
  `createHonoQueryOptions` / `createHonoMutationOptions`, giving fully-typed
  `useQuery` / `useMutation` hooks.

> Rename a column in `schema.ts` and TypeScript flags every affected call site —
> the API, the sort enum, and the table column — at compile time.

---

## 📂 Project Structure

```
.
├── apps/
│   ├── server/                     # Hono + Drizzle + Better-Auth
│   │   ├── src/
│   │   │   ├── app.ts              # Hono app, mounts routes, exports AppType
│   │   │   ├── index.ts           # server bootstrap (PORT, default 8080)
│   │   │   ├── auth.ts            # Better-Auth (email/password) config
│   │   │   ├── db/
│   │   │   │   ├── schema.ts       # device + warranty_event tables
│   │   │   │   ├── auth-schema.ts  # Better-Auth tables
│   │   │   │   └── seed.ts         # Faker seed (~250 devices)
│   │   │   ├── routes/
│   │   │   │   ├── devices.ts      # list / detail / notes
│   │   │   │   └── stats.ts        # metrics + filter metadata
│   │   │   └── services/
│   │   │       └── devices.service.ts  # search→filter→sort→paginate (Drizzle)
│   │   └── drizzle.config.ts
│   ├── web/                        # React + Vite + TanStack Router
│   │   └── src/
│   │       ├── routes/             # file-based routes (see below)
│   │       ├── queries/            # typed query/mutation options
│   │       ├── components/         # app-shell, device-form/grid, dialogs…
│   │       ├── lib/                # formatters, icons, auth guard, schemas
│   │       └── utils/              # hono-client, auth-client
│   └── mobile/                     # Expo (React Native) + Expo Router
│       ├── app/                    # file-based screens (auth, tabs, devices)
│       ├── components/             # native UI, device form/list, sheet
│       ├── lib/                    # hono-client, auth-client, query-client
│       └── queries/               # typed query/mutation options (shared API)
└── packages/
    ├── ui/                         # Shadcn components (Button, Table, Select, …)
    └── validators/                 # shared Zod schemas + status helper
```

### Routes (`apps/web/src/routes`)

| Path                | Page | Access |
| ------------------- | ---- | ------ |
| `/`                 | Landing page | Public |
| `/sign-in`          | Sign in | Public |
| `/sign-up`          | Sign up | Public |
| `/forgot-password`  | Request reset link | Public |
| `/reset-password`   | Set new password | Public |
| `/dashboard`        | Metrics + device table | Protected |
| `/devices/$id`      | Device details | Protected |

---

## 🔌 API Reference

All `/devices` and `/stats` routes require an authenticated session
(`401` otherwise). Base URL defaults to `http://localhost:8080`.

| Method  | Path                      | Description |
| ------- | ------------------------- | ----------- |
| `GET`   | `/health`                 | Health check |
| `GET`   | `/devices`                | Paginated list (search/filter/sort) |
| `GET`   | `/devices/:id`            | Single device incl. warranty timeline |
| `POST`  | `/devices`                | Create a device (derives expiry + purchase event) |
| `PATCH` | `/devices/:id`            | Update a device (recomputes expiry) |
| `DELETE`| `/devices/:id`            | Delete a device (timeline cascades) |
| `PATCH` | `/devices/:id/notes`      | Update a device's notes |
| `GET`   | `/stats`                  | Dashboard summary metrics |
| `GET`   | `/stats/meta`             | Distinct brands & categories (for filters) |
| `*`     | `/api/auth/*`             | Better-Auth handler |

### `GET /devices` query parameters

| Param      | Type | Default | Notes |
| ---------- | ---- | ------- | ----- |
| `search`   | string | — | Matches name, brand, model, serial (case-insensitive) |
| `status`   | `active` \| `expiring_soon` \| `expired` | — | Derived from expiry date |
| `brand`    | string | — | Exact match |
| `category` | string | — | Exact match |
| `sort`     | `name` \| `brand` \| `purchaseDate` \| `warrantyExpiry` \| `status` | `warrantyExpiry` | |
| `order`    | `asc` \| `desc` | `asc` | |
| `page`     | number | `1` | |
| `pageSize` | number (≤100) | `10` | |

**Response**

```json
{
  "data": [ /* Device[] with derived `status` */ ],
  "meta": { "page": 1, "pageSize": 10, "total": 250, "totalPages": 25 }
}
```

Warranty status is derived (not stored) by a single shared helper:
`expired` if past expiry, `expiring_soon` within 30 days, otherwise `active`.

---

## 🚀 Local Setup

### Prerequisites

- Node.js ≥ 22
- pnpm ≥ 8
- A PostgreSQL database (local, Docker, or hosted e.g. Neon/Supabase)

### 1. Install dependencies

```bash
pnpm i
```

### 2. Configure environment

```bash
cp .env.example .env
```

Then edit `.env`:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/warranty"
BETTER_AUTH_SECRET="generate-a-long-random-string-here"
VITE_SERVER_URL="http://localhost:8080"
WEB_URL="http://localhost:5173"
```

> Need a quick local database? Run one in Docker:
> ```bash
> docker run -d --name warranty-pg \
>   -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=warranty \
>   -p 5434:5432 postgres:16-alpine
> ```

### 3. Push the schema & seed data

```bash
pnpm db:push    # create tables (drizzle-kit push)
pnpm db:seed    # insert ~250 demo devices + warranty timelines
```

### 4. Run

```bash
pnpm dev        # starts the Hono API (:8080) and the web app (:5173)
```

Open **http://localhost:5173**, click **Get started**, and create an account
(any email + password ≥ 8 chars). The seeded devices are visible to any account.

### Run the mobile app (Expo)

The Expo app lives in `apps/mobile` and talks to the same API.

```bash
# 1. Make sure the API is running (pnpm dev, or the server alone).
# 2. Point the app at your API:
cp apps/mobile/.env.example apps/mobile/.env
#    Simulator/web → http://localhost:8080
#    Physical device (Expo Go) → http://<YOUR_LAN_IP>:8080  (same Wi-Fi)
# 3. Start Expo:
pnpm --filter @repo/mobile dev      # then press i / a / w, or scan the QR
```

> The monorepo uses **`node-linker=hoisted`** (in `.npmrc`) — required for Expo's
> Metro bundler to resolve dependencies in a pnpm workspace.

### Monorepo scripts

Run from the repo root. Most root scripts are thin wrappers over a single
workspace (via `pnpm --filter`) or fan out across all of them (via Turborepo),
so you can drive any individual app without `cd`-ing into it.

| Command | Runs | Description |
| ------- | ---- | ----------- |
| `pnpm dev`         | all      | API + web together (Turborepo, parallel) |
| `pnpm dev:web`     | web      | Just the Vite web app (`:5173`) |
| `pnpm dev:server`  | server   | Just the Hono API + tsc watch (`:8080`) |
| `pnpm dev:mobile`  | mobile   | Expo dev server (press `i` / `a` / `w`) |
| `pnpm build`       | all      | Production build of every package |
| `pnpm build:web`   | web      | Build only the web app |
| `pnpm build:server`| server   | Build only the API |
| `pnpm start`       | server   | Run the built API (`node dist`) |
| `pnpm preview`     | web      | Preview the production web build |
| `pnpm mobile:ios`  | mobile   | Build & launch the iOS dev client |
| `pnpm mobile:android` | mobile | Build & launch the Android dev client |
| `pnpm lint`        | all      | ESLint across packages |
| `pnpm typecheck`   | mobile   | `tsc --noEmit` for the mobile app |
| `pnpm format`      | repo     | Prettier write (`**/*.{ts,tsx,md}`) |
| `pnpm db:push`     | server   | Apply the Drizzle schema (`drizzle-kit push`) |
| `pnpm db:seed`     | server   | Seed ~250 demo devices + timelines |
| `pnpm db:studio`   | server   | Browse the database (`drizzle-kit studio`) |
| `pnpm create:route <name>` | server | Scaffold a new Hono route |
| `pnpm ui-add <name>`       | ui     | Add a Shadcn component |

---

## 🌐 Deployment

The front-end and back-end deploy independently:

- **Database** → a hosted Postgres (Neon / Supabase). Run `pnpm db:push` and
  `pnpm db:seed` against it.
- **API (`apps/server`)** → any Node host (Render / Railway / Fly). Set
  `DATABASE_URL`, `BETTER_AUTH_SECRET`, `VITE_SERVER_URL`, and `WEB_URL`
  (the deployed web origin, for CORS). Health check: `/health`.
- **Web (`apps/web`)** → a static host (Vercel / Netlify). Set `VITE_SERVER_URL`
  to the deployed API origin. The web app reads it via
  `import.meta.env.VITE_SERVER_URL`.

---

## 🧭 Implementation Notes & Decisions

This section captures the **why** behind the notable choices — the trade-offs,
the deviations from the brief, and the conventions that keep the codebase
cohesive.

### Architecture

- **Why a monorepo (pnpm workspaces + Turborepo).** The web app, the API, and
  the mobile app all need to agree on the same types and validation rules.
  Putting them in one repo with shared `packages/validators` (Zod) and
  `@repo/server` (which exports the API's `AppType`) means a change to a route
  or a column is type-checked across **every** consumer at once. Turborepo
  caches and parallelizes `build`/`lint`/`dev` across the graph.
- **Why end-to-end type safety is the headline.** The single most valuable
  property here is that a type defined once in the Drizzle schema flows
  unbroken to the rendered table cell (see the diagram above). There are **no
  hand-written DTOs, fetch wrappers, or response interfaces** — they're all
  inferred. Renaming a column is a compile-time refactor, not a runtime bug.

### Back-end / API

- **Why Hono instead of Express.** The brief *preferred* Express but allowed any
  framework. Express was rejected for one decisive reason: it has **no typed
  client**. Hono exposes its app type (`AppType = typeof app`), which the
  frontend consumes via `hc<AppType>()` (Hono RPC) — that's what makes request
  shapes and JSON responses fully inferred on the client. Hono is also
  web-standard (`Request`/`Response`), tiny, runs on Node via
  `@hono/node-server`, and is portable to edge runtimes later.
- **All data handling runs in the database, not the client.** Search (`ilike`
  across name/brand/model/serial), status filtering, sorting, and pagination are
  composed into a single SQL query with Drizzle in
  `apps/server/src/services/devices.service.ts`. This is the correct shape for an
  API requirement and scales past the ~250-row demo to arbitrarily large
  datasets — the client only ever receives one page.
- **Why Drizzle + PostgreSQL.** Drizzle gives a TypeScript-first schema whose
  row types are *inferred* (no codegen step), plus `drizzle-kit push`/`studio`
  for a fast local loop. Postgres provides the `ilike` and date-range predicates
  the filters rely on.
- **`PORT` is configurable** (default `8080`) to avoid clashing with other local
  services; `/health` is exposed for deployment health checks.

### Domain & data

- **Warranty status is derived, never stored.** A single helper in
  `packages/validators` computes `expired` / `expiring_soon` (≤ 30 days) /
  `active` from the expiry date. Storing status would go stale the moment a date
  passes; deriving it keeps the dashboard metrics, the table badges, the filter,
  and the details view perfectly consistent. The **status filter** is translated
  back into date-range predicates so it can run in SQL.
- **Devices are global demo data (not user-scoped).** This is a deliberate
  *demo* convenience so the seeded dataset is visible to any account you create —
  no need to seed-then-claim. In a real product these would be scoped to the
  owner; the schema and services are structured so adding a `userId` filter is a
  small change.
- **Prices are stored as whole integer currency units (USD)** to keep the demo
  simple (no cents/precision concerns), and formatted at the edge with
  `Intl.NumberFormat` (`en-US`). The seed (retailers, providers, currency) is
  US/international-flavored.
- **The seed is deterministic** (`faker.seed(42)`) so re-seeds and recorded
  demos look identical every run.

### Front-end

- **The URL is the source of truth for table state.** Search, filter, sort, and
  page are TanStack Router search params validated by the **same**
  `deviceQuerySchema` the API uses. Views are therefore shareable and survive a
  refresh, and the params directly key the React Query cache (no duplicate
  client state to keep in sync).
- **React Query owns server state.** It provides the loading skeletons, error
  states, and cache invalidation after mutations (create/edit/delete/notes)
  for free, on both web and mobile.
- **A bespoke 3D landing hero** (React Three Fiber) choreographs a single phone
  model to scroll progress. It renders **on demand** (only while something
  animates) and degrades gracefully: users with `prefers-reduced-motion` or no
  WebGL get a static 2D phone, and small viewports get a separate, non-scrolling
  promo page (`MobileLanding`) instead of the full scroll story.

### Auth

- **Authentication is real, not mocked.** The brief allowed mocking, but
  email/password auth is wired end-to-end with Better-Auth and a `requireAuth`
  route guard (`apps/web/src/lib/guard.ts`). Web uses cookie sessions; the
  mobile app uses bearer-token sessions via the Better-Auth Expo plugin.
- **Forgot/reset is functional.** Since there's no mail server wired up, the
  reset link/token is logged to the server console instead of emailed, and
  email verification is disabled so demo accounts are usable immediately.

### Mobile

- **The Expo app is a true client of the same backend** — it imports the shared
  validators and `@repo/server` types and talks to the identical Hono API, which
  is the clearest possible proof that the type-safe contract is reusable across
  platforms.
- **`node-linker=hoisted`** is set in `.npmrc` because Expo's Metro bundler
  can't resolve the default pnpm symlinked store in a workspace.

### Trade-offs & known limitations

- **No automated test suite.** TypeScript (strict) + ESLint are the safety net
  for the assignment's scope; the type system already catches the class of bugs
  unit tests would here. Service functions are written to be easily testable if
  added.
- **Reset email is console-logged**, not delivered (no SMTP configured).
- **Global devices** are a demo simplification (see above).

---

## 🛣️ Roadmap / ToDo

Planned follow-ups not yet implemented:

- [ ] **Profile page (mobile)** — a dedicated screen showing the signed-in user's
  name/email with the ability to edit account details.
- [ ] **Proper logout flow (mobile)** — move sign-out into the profile screen with
  a clear confirmation, full session/token teardown, query-cache reset, and a
  reliable redirect back to the auth stack.

---

_This project was scaffolded from the Reno Stack; the original starter README is
preserved as `README.reno-original.md`._
