# Warrantly — Warranty & Device Tracker

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
- **Type-safe API** — Hono routes consumed through Hono RPC + React Query, so
  the client never hand-writes a fetch call or a response type.

---

## 🧱 Tech Stack

| Layer        | Technology |
| ------------ | ---------- |
| Front-end    | React + Vite, TanStack Router (file-based), TanStack Query, Tailwind CSS, Shadcn UI |
| Type-safe API client | Hono RPC + [`@reno-stack/hono-react-query`](https://github.com/reno-stack/hono-react-query) |
| Back-end     | Hono (Node), Drizzle ORM, PostgreSQL |
| Auth         | Better-Auth (email & password) |
| Validation   | Zod schemas shared across client & server (`packages/validators`) |
| Seed data    | `@faker-js/faker` (~250 devices) |
| Tooling      | pnpm workspaces, Turborepo, TypeScript, ESLint |

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
│   └── web/                        # React + Vite + TanStack Router
│       └── src/
│           ├── routes/             # file-based routes (see below)
│           ├── queries/            # typed query/mutation options
│           ├── components/         # app-shell, auth-layout, status-badge
│           ├── lib/                # formatters, auth guard, auth schemas
│           └── utils/              # hono-client, auth-client
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

### Useful commands

| Command | Description |
| ------- | ----------- |
| `pnpm dev`      | Run API + web together (Turborepo) |
| `pnpm build`    | Production build of all packages |
| `pnpm db:push`  | Apply the Drizzle schema (`drizzle-kit push`) |
| `pnpm db:seed`  | Seed demo data |
| `pnpm db:studio`| Browse the database (`drizzle-kit studio`) |
| `pnpm create:route <name>` | Scaffold a new Hono route |
| `pnpm ui-add <name>`       | Add a Shadcn component |

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

- **Authentication is real, not mocked.** The brief allowed mocking, but Reno
  ships Better-Auth, so email/password auth is wired end-to-end with a
  `requireAuth` route guard (`apps/web/src/lib/guard.ts`). The forgot/reset flow
  is functional; since there's no mail server, the reset link is logged to the
  server console.
- **Devices are global demo data** (not user-scoped) so the seeded dataset is
  immediately visible to any account you create.
- **All data handling is server-side.** Search (`ilike`), status filtering
  (translated to date-range predicates), sorting, and pagination all run in
  PostgreSQL via Drizzle — see `apps/server/src/services/devices.service.ts`.
- **Table state lives in the URL.** Search/filter/sort/page are TanStack Router
  search params, so views are shareable and survive refresh, and they key the
  React Query cache.
- **Status logic is defined once** in `packages/validators` and reused by the
  dashboard metrics, the table badges, and the details view.
- **`PORT` is configurable** (default `8080`) via the env, to avoid clashing with
  other local services on `8000`.

---

_This project was scaffolded from the Reno Stack; the original starter README is
preserved as `README.reno-original.md`._
