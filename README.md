# SmartLease

Property management platform with admin and tenant portals, powered by Firebase.

## Features

- **Admin portal:** Dashboard, properties, tenants, leases, billing, maintenance, reports
- **Tenant portal:** Rent overview, payments, maintenance requests, profile
- **Firebase:** Authentication + Firestore (Spark plan; no Firebase Storage)
- **Demo payments:** Firestore-recorded payments with Stripe-ready gateway interface

## Quick start

1. Copy environment file:
   ```bash
   cp .env.example .env
   ```

2. Create a [Firebase project](https://console.firebase.google.com) and add a web app. Fill in `.env` with your Firebase config.

3. Enable **Email/Password** authentication in Firebase Console.

4. Create a Firestore database (production mode) and deploy rules:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use your-project-id
   npm run firebase:deploy:rules
   ```

5. Download a **service account key** (Project Settings → Service accounts → Generate key). Save as `serviceAccountKey.json` (gitignored) and set:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
   FIREBASE_PROJECT_ID=your-project-id
   ```

6. Seed the database:
   ```bash
   npm run seed
   ```

7. Start the app:
   ```bash
   npm install
   npm run dev
   ```

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@smartlease.demo` | `Admin123!` |
| Tenant | `john.smith@demo.com` | `Tenant123!` |
| Tenant | `sarah.johnson@demo.com` | `Tenant123!` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run seed` | Seed Firestore + Auth users |
| `npm run firebase:deploy:rules` | Deploy security rules |

## Documentation

- [Firebase Setup](docs/FIREBASE_SETUP.md)
- [Firestore Schema](docs/FIRESTORE_SCHEMA.md)
- [Database Seeding](docs/SEEDING.md)
- [Deployment](docs/DEPLOYMENT.md)

## Tech stack

React 18, Vite 6, React Router 7, Tailwind CSS 4, Firebase 11, Recharts, Sonner
