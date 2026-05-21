# Firebase Setup Guide

## 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (e.g. `smartlease-prod`)
3. Enable Google Analytics (optional)

## 2. Register a web app

1. Project Overview → Add app → Web
2. Copy the `firebaseConfig` values into `.env`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## 3. Enable services

### Authentication
- Build → Authentication → Sign-in method
- Enable **Email/Password**

### Firestore
- Build → Firestore Database → Create database
- Start in **production mode**
- Choose a region close to your users

### Firebase Storage (not required)
This app targets the **Spark (free) plan** and does **not** use Firebase Storage. Profile and maintenance photos are optional small images stored as data URLs in Firestore (max 500KB). You do **not** need to enable Storage in the console.

Keep `VITE_FIREBASE_STORAGE_BUCKET` in `.env` (it is part of the standard web app config from Firebase).

## 4. Deploy security rules

Update `.firebaserc` with your project ID:

```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

Deploy rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## 5. Service account (for seeding)

1. Project Settings → Service accounts
2. Generate new private key → save as `serviceAccountKey.json`
3. Add to `.gitignore` (never commit this file)
4. Set environment variables:

```bash
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
FIREBASE_PROJECT_ID=your-project-id
```

## 6. Seed data

```bash
npm run seed
```

## 7. Custom claims (optional)

The seed script sets `role` custom claims (`admin` | `tenant`) for faster rule evaluation. The app also reads `role` from the `users` collection, so manually registered users work without claims.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `permission-denied` | Deploy rules; ensure user profile exists in `users/{uid}` |
| Missing index error | Deploy `firestore.indexes.json` or create index from console link |
| Auth `invalid-credential` | Run seed or verify email/password |
| Env vars not loading | Restart `npm run dev` after editing `.env` |
