# Deployment

Production topology:

| Component | Host | URL (example) |
| --- | --- | --- |
| Web (Vite SPA) | **Vercel** | `https://app.pluto.com` |
| API (Hono) | **Railway** | `https://api.pluto.com` |
| Database (Postgres) | **Railway** | internal connection string |
| Mobile (Expo) | EAS / app stores | points at the API URL |

Web and API are served from subdomains of the **same parent domain** so the
session cookie can be shared (`COOKIE_DOMAIN=.pluto.com`). Mobile uses bearer
tokens and is unaffected by cookie settings.

---

## 1. Database (Railway)

1. Create a new Railway project → **Add → Database → PostgreSQL**.
2. Copy the **internal** connection string (`postgresql://...railway.internal:5432/railway`)
   from the database service's *Variables* tab. Using the internal URL keeps DB
   traffic on Railway's private network (no SSL/egress headaches).

## 2. API service (Railway)

1. In the same project, **Add → GitHub Repo** and select this repo.
2. Railway reads [`railway.json`](./railway.json) automatically:
   - install: `pnpm install --frozen-lockfile` (from the monorepo root, so the
     `workspace:*` packages resolve)
   - pre-deploy: `pnpm --filter @repo/server db:push:prod && pnpm --filter @repo/server db:seed:prod`
     (applies the Drizzle schema, then seeds ~250 demo devices **only if the DB
     is empty** — redeploys keep existing data)
   - start: `pnpm --filter @repo/server start:prod` (runs the server via `tsx`,
     which transpiles the workspace TypeScript packages at runtime)
3. Set the service **Variables**:

   | Variable | Value | Notes |
   | --- | --- | --- |
   | `NODE_ENV` | `production` | makes `WEB_URL` required |
   | `DATABASE_URL` | _Railway PG internal URL_ | reference the DB service's var |
   | `BETTER_AUTH_SECRET` | _random 32+ char string_ | `openssl rand -base64 32` |
   | `WEB_URL` | `https://app.pluto.com` | CORS + auth trusted origin |
   | `VITE_SERVER_URL` | `https://api.pluto.com` | required by the server env schema |
   | `BETTER_AUTH_URL` | `https://api.pluto.com` | canonical API origin for auth |
   | `COOKIE_DOMAIN` | `.pluto.com` | shares the cookie across subdomains |

   > `DATABASE_URL` can be set to `${{ Postgres.DATABASE_URL }}` to reference the
   > database service directly.

4. Under **Settings → Networking**, add the custom domain `api.pluto.com`
   (create the CNAME Railway shows you at your DNS provider). `PORT` is injected
   by Railway automatically — the server already reads `process.env.PORT`.

5. Demo data is seeded automatically by the pre-deploy step (idempotent — it
   only runs when the `device` table is empty). To force a full re-seed, run
   `pnpm --filter @repo/server db:seed` via `railway run` (no `SEED_IF_EMPTY`),
   which clears and reinserts the dataset.

## 3. Web app (Vercel)

1. **New Project → Import** this repo.
2. Under **Settings → General → Root Directory**, leave it **empty** (repo root).
   Do **not** set it to `apps/web` — the monorepo install and Turbo build must
   run from the repository root.
3. Under **Settings → Build & Deployment**, either disable the dashboard
   overrides and let [`vercel.json`](./vercel.json) drive the build, or set
   these values explicitly:

   | Setting | Value |
   | --- | --- |
   | Framework Preset | Other (or Vite with overrides below) |
   | Install Command | `pnpm install --frozen-lockfile` |
   | Build Command | `pnpm turbo run build --filter=@repo/web` |
   | Output Directory | `apps/web/dist` |
   | Root Directory | *(empty — repo root)* |

   > **Common mistake:** Root Directory = `apps/web` + Output Directory =
   > `apps/web/dist` makes Vercel look for `apps/web/apps/web/dist`, which does
   > not exist. If Root Directory = `apps/web`, use [`apps/web/vercel.json`](./apps/web/vercel.json)
   > (Output = `dist`, Install/Build `cd ../..` to the monorepo root).
   >
   > **Do not use `web/dist`** — the app lives at `apps/web`, not `web`.
   >
   > **"No Output Directory named dist" after a successful build:** the repo
   > used to gitignore all `dist/` folders, so Vercel skipped the built
   > `apps/web/dist` artifact. That is fixed — only server/validator dists are
   > ignored now.

   [`vercel.json`](./vercel.json) already encodes the recommended settings:
   - build: `pnpm turbo run build --filter=@repo/web` (Turbo builds the workspace
     deps `@repo/validators` and `@repo/server` first — web consumes their
     generated `dist` type declarations, which are gitignored)
   - output: `apps/web/dist`
   - SPA fallback rewrite to `/index.html`
4. Add an **Environment Variable** (Production):

   | Variable | Value |
   | --- | --- |
   | `VITE_SERVER_URL` | `https://api.pluto.com` |

   > Vite inlines this at **build time**, so a redeploy is required if you change it.

5. Add the custom domain `app.pluto.com` under **Settings → Domains**.

## 4. Mobile (Expo)

Not deployed to Railway. Point the app at the API and build with EAS:

```bash
EXPO_PUBLIC_SERVER_URL="https://api.pluto.com" pnpm --filter @repo/mobile ios   # or android
```

For release builds, set `EXPO_PUBLIC_SERVER_URL` in the EAS build profile/secrets.

---

## Notes & gotchas

- **Cross-subdomain cookies**: `COOKIE_DOMAIN=.pluto.com` + `BETTER_AUTH_URL`
  make better-auth issue a `Secure`, `SameSite=Lax` cookie scoped to `.pluto.com`.
  Because `app.` and `api.` are the same site, the browser sends it on
  cross-origin `fetch` (with `credentials: "include"`). Without a shared parent
  domain you'd instead need `SameSite=None` — using subdomains is cleaner.
- **First deploy order**: bring up Postgres → API → web. The API's pre-deploy
  migration needs the DB to exist first.
- **`db:push` vs migrations**: this uses Drizzle's `push` (schema sync), which is
  fine for this project. For stricter environments, switch to generated SQL
  migrations (`drizzle-kit generate` + `migrate`).
- **Why `tsx` in production**: `@repo/validators` is published to the workspace as
  TypeScript source (`exports.default → ./src/index.ts`), so plain `node` can't
  import it. `tsx` transpiles workspace TS on the fly. (Alternatively, bundle the
  server with tsup/esbuild and run plain `node`.)
