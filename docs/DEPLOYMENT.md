# Deployment

## Production build

```bash
cp .env.example .env
# Fill production Firebase values

npm install
npm run build
```

Output is in `dist/`.

## Netlify

The repo includes `netlify.toml` (build → `dist/`, SPA fallback). In the Netlify UI, set **Environment variables** for every `VITE_*` value from `.env.example`, then trigger a new deploy so Vite inlines them at build time.

**Do not** add server-only variables to Netlify (`GOOGLE_APPLICATION_CREDENTIALS`, `FIREBASE_PROJECT_ID`) — they are for local `npm run seed` only. If secrets scanning fails on benign matches, `netlify.toml` already sets `SECRETS_SCAN_OMIT_KEYS` / `SECRETS_SCAN_OMIT_PATHS`; remove duplicate secret env vars from the Netlify UI when possible.

`VITE_*` values are public in the built JS bundle. Do not mark them as “secret” in Netlify unless you also omit them from scanning.

Add your Netlify site URL under Firebase Console → Authentication → **Authorized domains** if sign-in fails in production.

## Firebase Hosting

1. Configure `.firebaserc` with production project ID
2. Build the app: `npm run build`
3. Deploy:

```bash
firebase deploy --only hosting
```

Hosting config (`firebase.json`) serves `dist/` with SPA rewrites to `index.html`.

## Environment variables in CI

Set these as secrets in your CI/CD platform:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_PAYMENT_GATEWAY=demo`

Rebuild on each deploy — Vite inlines env vars at build time.

## Deploy rules separately

```bash
npm run firebase:deploy:rules
```

Or full deploy:

```bash
firebase deploy
```

## Stripe (future)

1. Set `VITE_PAYMENT_GATEWAY=stripe`
2. Add `VITE_STRIPE_PUBLISHABLE_KEY`
3. Implement `src/payments/stripe-gateway.ts` with your backend

## Checklist

- [ ] Firestore rules deployed
- [ ] Composite indexes deployed
- [ ] Seed run on production (or migration plan)
- [ ] `.env` not committed
- [ ] `serviceAccountKey.json` not committed
- [ ] Auth email/password enabled
- [ ] Production build succeeds (`npm run build`)
