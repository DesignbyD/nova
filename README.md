# NOVA

A premium, original e-commerce storefront built with Next.js, TypeScript, Tailwind CSS and Supabase.

> **Status: Phase 2 of 15 complete (design system and global layout).**
> Supabase, Google OAuth and Mailgun are intentionally not wired up yet. See [Roadmap](#roadmap).

## Technology stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 |
| Database / Auth | Supabase (PostgreSQL, Auth, Google OAuth), added in Phases 7 and 9 |
| Transactional email | Mailgun, added in Phase 11 |
| Hosting | Vercel |

## Requirements

- Node.js 20.9 or newer (22 recommended, see `.nvmrc`)
- npm 10 or newer

## Local development

```bash
npm install
cp .env.example .env.local   # fill in values as phases require them
npm run dev                  # http://localhost:3000
```

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript compiler without emitting |

## Project structure

```
app/                 Routes, layouts, route handlers (App Router)
components/
  ui/                Design-system primitives (Button, Field, Badge, Dialog...)
  layout/            Header, footer, navigation, drawers
  shop/              Product cards, grids, filters
  cart/              Cart drawer and cart UI
  checkout/          Checkout form and summary
  account/           Account and order-history UI
lib/
  supabase/          Supabase clients (browser, server, admin), one of each
  services/          Business logic (orders, products, pricing)
  email/             Mailgun client and email templates
  validation/        Shared input schemas (client and server)
  utils/             Small pure helpers
  site.ts            Site-level constants
  nav.ts             Navigation and footer link config
types/               Shared TypeScript types
supabase/migrations/ SQL migrations (schema, RLS policies, seed data)
public/              Static assets
```

Design tokens and components are documented in [DESIGN.md](./DESIGN.md). During development, visit `/design` to see them all.

Boundaries: UI components never talk to the database directly. They call server
actions or route handlers, which call services, which use the Supabase clients.

## Environment variables

See `.env.example` for the full list. Rules:

- Only variables prefixed `NEXT_PUBLIC_` reach the browser.
- `SUPABASE_SERVICE_ROLE_KEY` and all `MAILGUN_*` values are server-only secrets.
- `.env.local` is git-ignored. Never commit real secrets.

## Supabase setup, Google OAuth, Mailgun, Deployment

These sections are filled in as the corresponding phases land (7, 9, 11 and 15).

## Roadmap

1. Project initialization and architecture (done)
2. Design system and global layout (done)
3. Homepage and storefront
4. Product pages and search
5. Cart
6. Checkout UI
7. Supabase database integration
8. Order creation
9. Google authentication
10. Customer account and order history
11. Mailgun transactional email
12. Error handling and security
13. Responsive, accessibility and performance refinement
14. Testing
15. Production deployment preparation
