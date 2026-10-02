# NOVA

A premium e-commerce storefront: Next.js 16, TypeScript, Tailwind CSS 4, Supabase (Postgres, Auth, Google OAuth) and Mailgun.

## What is included

- Storefront: homepage, shop (search, category filter, sort), collections, product pages, about
- Cart (persisted in the browser, drawer on desktop, full-screen on phones)
- Checkout with client and server validation; the **server prices every order from the database**
- Duplicate-submit protection (idempotency key) and oversell protection (row locks), inside one database transaction
- Google sign-in (Supabase Auth), protected account area, order history, order details
- Order confirmation email through Mailgun (HTML and plain text); email failures never affect the order
- Row Level Security: customers can only read their own orders
- Newsletter signup stored in the database
- SEO: metadata, Open Graph, sitemap, robots, product structured data

## Run it locally

```bash
npm install
cp .env.example .env.local      # Windows Command Prompt: copy .env.example .env.local
npm run dev                     # http://localhost:3000
```

With no keys set, development mode shows the bundled demo catalog so you can browse everything.
**Checkout, sign-in and the newsletter need Supabase** (below). Nothing pretends to work without it.

Commands: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`, `npm run typecheck`, `npm test`.

## 1. Supabase setup

1. Create a project at supabase.com.
2. **SQL Editor**: run `supabase/migrations/0001_schema.sql`, then `supabase/seed.sql` (12 demo products).
3. **Project Settings > API**: copy into `.env.local`
   - Project URL -> `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key -> `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `service_role` key -> `SUPABASE_SERVICE_ROLE_KEY` (**secret**: never share, never prefix with `NEXT_PUBLIC_`)
4. Restart `npm run dev`. The shop now reads from your database.

## 2. Google sign-in

1. Google Cloud Console > APIs & Services > **OAuth consent screen**: configure it (External is fine).
2. **Credentials > Create credentials > OAuth client ID > Web application**.
   - Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
3. Copy the Client ID and Client Secret.
4. Supabase > **Authentication > Providers > Google**: enable, paste the Client ID and Secret, save.
5. Supabase > **Authentication > URL Configuration**:
   - Site URL: `http://localhost:3000` while developing (your Vercel URL in production)
   - Redirect URLs: add `http://localhost:3000/**` and `https://<your-vercel-domain>/**`

The Google client secret lives only in Supabase. It is never in this repo.

## 3. Mailgun

1. Create a Mailgun account and a domain. For testing, Mailgun's **sandbox domain** works, but it only delivers to **authorized recipients**: add your own address under Sending > Domain settings > Authorized recipients and confirm it.
2. Set `MAILGUN_API_KEY` (a Sending key), `MAILGUN_DOMAIN`, and `MAILGUN_FROM_EMAIL` (for example `NOVA <postmaster@sandboxXXXX.mailgun.org>`).
3. EU region accounts: set `MAILGUN_API_URL=https://api.eu.mailgun.net`.
4. Production: add and verify your own domain (DNS: SPF, DKIM, and the MX/tracking records Mailgun lists), then use an address on it.

If Mailgun rejects a message, the order is still saved, the reason is stored on the order (`email_status`, `email_error`), and the success page tells the customer plainly.

## 4. Deploy to Vercel

1. Push this repo to GitHub (it is already a git repository; `.env.local` is ignored).
2. Vercel > **Add New Project** > import the repo. Framework preset: Next.js.
3. **Environment Variables**: add every variable from `.env.example` (all environments), with `NEXT_PUBLIC_SITE_URL` set to your production URL.
4. Deploy, then update:
   - Supabase **Site URL** and **Redirect URLs** to your production domain
   - Google OAuth redirect URI stays `https://<project-ref>.supabase.co/auth/v1/callback` (no change)
5. Redeploy once after changing `NEXT_PUBLIC_*` variables (they are baked in at build time).

## Project structure

```
app/                  Routes: storefront, checkout, account, auth, API (orders, search)
components/           ui (design system), layout, shop, cart, checkout, account, home
lib/                  supabase clients, services (products, orders), email, validation, cart logic
data/catalog.json     Demo catalog: source for the seed SQL and the local dev catalog
supabase/             Migration, generated seed, SQL tests
scripts/              Product art generator, seed generator
tests/                Unit tests (vitest)
```

Design tokens and components are documented in [DESIGN.md](./DESIGN.md). `/design` shows them in development.

## Security notes

- Prices and totals come from the database, never from the browser.
- `SUPABASE_SERVICE_ROLE_KEY` and `MAILGUN_*` are server-only; the admin client is guarded with `server-only`.
- Row Level Security on every table; browsers can only read products and their own orders.
- The order success page needs the secret link returned at checkout (or the owner signed in).
- Login redirects accept same-site paths only.
- Security headers are set in `next.config.ts`.

## Known limits (honest list)

- **No payment provider.** Orders are created as `pending`. Add Stripe or similar before taking real money.
- No admin dashboard: change order status and stock in the Supabase table editor.
- Guest orders are not linked to an account later, even with the same email.
- No rate limiting on the API (add one, for example Vercel's WAF or Upstash, before launch).
- No strict Content-Security-Policy yet.
- Re-running `seed.sql` resets stock to the catalog values.

## Regenerating assets

- `npm run art` redraws the product images from `scripts/generate-product-art.mjs`.
- `npm run seed:generate` rebuilds `supabase/seed.sql` from `data/catalog.json`.
