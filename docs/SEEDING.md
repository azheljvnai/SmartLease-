# Database Seeding

## Prerequisites

- Firebase project configured (see [FIREBASE_SETUP.md](FIREBASE_SETUP.md))
- Service account JSON downloaded
- Firestore rules deployed (recommended before seed)

## Environment

```bash
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
FIREBASE_PROJECT_ID=your-project-id
```

## Run seed

```bash
npm run seed
```

The script is **idempotent** for Auth users (updates password if email exists) and uses deterministic document IDs for core entities.

## What gets seeded

### Auth users + profiles

| Email | Password | Role |
|-------|----------|------|
| admin@smartlease.demo | Admin123! | admin |
| john.smith@demo.com | Tenant123! | tenant |
| sarah.johnson@demo.com | Tenant123! | tenant |
| michael.brown@demo.com | Tenant123! | tenant |
| emily.davis@demo.com | Tenant123! | tenant |

### Properties (4)

- Sunset Apartments (24 units)
- Downtown Plaza (18 units)
- Riverside Condos (32 units)
- Garden Heights (16 units, maintenance status)

### Tenants (6)

John Smith, Sarah Johnson, Michael Brown, Emily Davis, David Wilson, Robert Taylor — with matching rent and payment statuses from the UI mock data.

### Other data

- Units with occupancy assignments
- Active lease for John Smith (2026)
- 5 invoices (INV-001 through INV-005)
- Payment history for John
- 4 maintenance requests with timeline updates
- 3 technicians
- 4 dashboard activities
- 1 building notice
- 1 default payment method for John

## Verify seeding

1. Log in as `admin@smartlease.demo` → Dashboard shows KPIs and activity
2. Log in as `john.smith@demo.com` → Home shows Unit 101, rent ₱1,200
3. Firebase Console → Firestore → confirm collections populated

## Re-seed

Running `npm run seed` again merges/updates documents with the same IDs. To fully reset, delete collections in Firebase Console first.
