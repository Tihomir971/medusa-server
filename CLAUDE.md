# CLAUDE.md - Medusa Server

Medusa v2.13.1 e-commerce backend. **Standalone app** — uses **npm** (not Bun), not part of monorepo workspaces.

## Stack

- **Runtime**: Node.js >=20 | **DB**: PostgreSQL | **Cache/Events/Workflows**: Redis
- **Language**: TypeScript (strict null checks, ES2021, Node16 modules)
- **Admin UI**: React (Vite-based), `@medusajs/ui` components, `@medusajs/admin-sdk`
- **Deployment**: Docker multi-stage build → Coolify. `db:migrate` runs automatically at container startup.

## Architecture

```
src/
├── modules/        # Custom modules (data models + services)
│   └── brand/      # Brand module: models/brand.ts, service.ts, index.ts
├── links/          # Module links (cross-module relations via defineLink)
│   └── product-brand.ts
├── workflows/      # Workflows (createWorkflow + createStep with compensation)
│   ├── steps/      # Reusable steps (create-brand, update-brand, delete-brand)
│   └── hooks/      # Workflow hooks (e.g. created-product.ts for product→brand linking)
├── api/
│   ├── middlewares.ts  # Zod validation, additionalDataValidator, query config
│   ├── admin/      # Admin routes (auto-authenticated)
│   │   └── brands/ # CRUD: route.ts (GET list, POST create), [id]/route.ts (GET, POST, DELETE)
│   └── store/      # Store routes (requires x-publishable-api-key header)
│       └── brands/ # Public brand listing
├── admin/
│   ├── lib/sdk.ts  # JS SDK init for admin UI (session auth)
│   ├── widgets/    # Widgets injected into existing pages (e.g. product-brand.tsx)
│   └── routes/     # Custom admin pages
│       └── brands/ # page.tsx (list + create drawer), [id]/page.tsx (detail + edit/delete)
├── scripts/        # Seed scripts (seed.ts, seed-serbia.ts)
├── subscribers/    # Event subscribers
└── jobs/           # Scheduled jobs
```

## Key Patterns

- **Modules**: `model.define()` for DML data models, `MedusaService({Model})` for auto-generated CRUD, `Module(NAME, {service})` for definition. Register in `medusa-config.ts` modules array.
- **Links**: `defineLink(ModuleA.linkable.x, ModuleB.linkable.y)` — use `isList: true` for one-to-many side. Run `db:migrate` to sync.
- **Workflows**: `createStep("name", invokeFn, compensationFn)` + `createWorkflow("name", fn)`. Steps return `StepResponse(result, compensationData)`.
- **Hooks**: Consume via `workflow.hooks.hookName(stepFn, compensationFn)`. Access `additional_data` from request body.
- **API Routes**: Export `GET`/`POST`/`DELETE` functions. Use `req.scope.resolve("query")` for Query, `req.validatedBody` for validated input, `req.queryConfig` for pagination.
- **Middlewares**: `defineMiddlewares({routes: [...]})` — `validateAndTransformBody(ZodSchema)`, `validateAndTransformQuery(schema, {defaults, isList})`, `additionalDataValidator` for extending core routes.
- **Admin Widgets**: Default export React component + `export const config = defineWidgetConfig({zone: "..."})`.
- **Admin Routes**: Default export React component in `src/admin/routes/<path>/page.tsx` + `defineRouteConfig({label, icon})` for sidebar.

## Commands

```bash
npm run dev           # Start dev server (admin: :9000/app, API: :9000/admin, :9000/store)
npm run build         # Build for production
npx medusa db:generate <module>  # Generate migrations (local only, commit results)
npx medusa db:migrate            # Run migrations + sync links
npm run seed          # Seed demo data
npm run seed:serbia   # Seed Serbia-specific data
```

## Environment Variables

`DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `COOKIE_SECRET`, `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS`, `BACKEND_URL`, `DISABLE_ADMIN`, `WORKER_MODE`

## Storefront Extensions Skill

A skill at `~/.claude/skills/medusa-dev/medusa-extensions/SKILL.md` documents all custom extensions for storefront developers (endpoints, data shapes, query field usage).

**Keep it in sync**: whenever you add, remove, or change a custom module, API endpoint, data field, or linking behaviour, update the skill to reflect the change. The skill is the storefront dev's source of truth for what this server exposes beyond stock Medusa.
