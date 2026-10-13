# Nexus Ecom CMS — Complete Client Installation

This local guide is for deploying one independent Nexus Ecom CMS installation for one client business. Do not share the source repository, this guide's client secrets, or the generated `.env` file with anyone who is not authorized to operate that client's deployment.

## Before deployment

Prepare the following before starting:

- Node.js 20 or later.
- A dedicated MongoDB database and a database user with read/write access only to that database.
- A production hostname, for example `shop.client-domain.com`.
- A real commercial license key created for that named client and domain.
- The licensing authority URL, held as `LICENSING_SERVER_URL` in the deployment environment.
- PNG, JPEG, or WebP store logo and favicon files, each under 500 KB.

Keep the source repository private. Give the client administrator access to their deployed application, not access to the source repository or licensing-service credentials.

## First deployment

1. Deploy the CMS code to the client server or hosting account.
2. Install dependencies:

   ```powershell
   npm ci
   ```

3. On a writable self-hosted server, start the app and open `/setup`.
4. Complete the installer in order:

   1. Enter the MongoDB URI and matching database name. The application performs a real server-side connection test.
   2. Enter the client's unique commercial license key. Do not reuse keys between clients.
   3. Add business identity, domain, contact details, logo, favicon, currency, locale, time zone, and the initial administrator account.
   4. On success, the browser downloads one generated `.env` file.

5. Save that downloaded `.env` file in a password-protected client/deployment record. Replace the deployment's existing `.env` or `.env.local` with the downloaded file, preserving it as a secret. Do not commit it to Git.
6. Restart the application:

   ```powershell
   npm run build
   npm run start
   ```

7. Sign in at `/admin/login`, verify the storefront, create products/categories, configure payment options, and place a controlled test order.

## Generated environment file

The final installer response produces the environment-file download once. It includes existing environment values plus the non-secret installation record needed for deployment consistency.

It never includes the administrator password. That password is bcrypt-hashed in MongoDB and must not be recoverable from an environment file. Store logos are saved in the settings document in MongoDB, not embedded in `.env`.

The file contains infrastructure values such as `MONGODB_URI` and `AUTH_SECRET`; treat it like a password. Never email it, upload it to public storage, commit it, or expose it through a `NEXT_PUBLIC_*` variable.

## Immutable hosts

Vercel, many container platforms, and managed hosts may not permit the installer to persist `.env.local`. For those platforms, configure `MONGODB_URI`, `AUTH_SECRET`, and licensing credentials through the host's secret manager, redeploy, then use `/setup` to verify the connection and finish the non-secret store setup.

## License handover record

For every client, retain this record outside the client application:

```text
Licensed business:
License key:
Approved production domain:
Installation ID:
Plan and support expiry:
Agreement/EULA version accepted:
Activation date:
```

The client agreement should grant a limited right to operate the named client business on the approved deployment. It should prohibit copying, source-code distribution, resale, sublicensing, reverse engineering, and use on unapproved domains. Have a qualified local IP/software lawyer review the agreement before relying on it for enforcement.

## Operations and recovery

- Back up MongoDB before upgrades and test restoration periodically.
- Rotate `AUTH_SECRET` only through a controlled maintenance procedure; a rotation invalidates active admin sessions.
- Do not expose MongoDB to the public internet. Restrict network access to the application/server IPs.
- If a license is disputed or an unauthorized deployment is found, preserve the domain, screenshots, activation logs, agreement, invoices, and Git history before seeking legal advice.
- The completed installer is locked; do not reopen it publicly to change production infrastructure. Use an authenticated maintenance process instead.
