# Nexus Ecom CMS

Nexus Ecom CMS is a Next.js storefront, POS and billing application with a client-installation flow. The default presentation is **Nexus Ecom Theme**. Each deployment is an independent client installation with its own MongoDB database and configuration.

## Architecture

- Next.js 14 App Router / React 18 / TypeScript / Tailwind CSS
- MongoDB through Mongoose 8
- Storefront: catalogue, filtering, cart, checkout and order tracking
- Administration: catalogue, categories, orders, banners, POS, billing, payment settings and licensing
- Persistent client settings: `Settings` document (`key: global`)
- Installation state: `Installation` document (`key: primary`)
- Administrator credentials: bcrypt-hashed `AdminUser` document

## Fresh installation

1. Install Node.js 20+ and provision a MongoDB database user with read/write access to a dedicated database.
2. Run `npm ci` and copy `.env.example` to `.env.local`. Do not put real credentials in `.env.example`.
3. Set `LICENSING_SERVER_URL` to the real licensing authority and, where used, payment/analytics values. These remain environment-only.
4. Run `npm run dev`, open `/setup`, and follow the enforced sequence:
   - MongoDB URI and matching database name
   - server-side connection verification
   - real license activation
   - business profile and first administrator
5. Restart the application after setup. The self-hosted installer writes `MONGODB_URI` and a generated `AUTH_SECRET` to `.env.local`; a restart makes these durable across processes.
6. Sign in at `/admin/login` and configure catalogue, banners and payment methods.

`/setup` tests MongoDB with a temporary Mongoose connection and `ping`; it does not return or log the connection URI. It accepts only `mongodb://` and `mongodb+srv://` URIs, has bounded connection timeouts, and applies a small per-client attempt limit. Once installation is complete, the public setup endpoint is locked.

## Hosted and container deployments

Many managed hosts have immutable filesystems. In that case do not run the database step expecting `.env.local` to be durable: set `MONGODB_URI` and a cryptographically-random `AUTH_SECRET` in the hosting provider's secret manager, redeploy, then use `/setup` to verify the database and finish the license/business steps. Never expose these values as `NEXT_PUBLIC_*` variables.

## Settings and secrets

Database-backed settings include site/business name, tagline, domain, contacts, locale, currency, timezone, theme and payment-method switches. The database URI, authentication secret, licensing endpoint/credentials, payment keys and analytics tokens remain environment-only.

Update ordinary settings from Administration. Changing infrastructure values requires a controlled environment change and restart. Back up MongoDB before upgrades; deploy code, run the build, then start the new version against the existing database. The initialization operations use upserts and do not delete collections or records.

## Verification

Run:

```powershell
npm ci
npm run build
```

The production build type-checks all routes, the installer UI and Mongoose models. A live MongoDB and licensing server are required to verify connection/authentication failures and real license activation end-to-end; no credentials are included in this repository.
