const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

// storageBucket is optional for init (Spark plan does not use Firebase Storage SDK)

export function getFirebaseConfig() {
  const missing = requiredEnvVars.filter((key) => !import.meta.env[key]);
  if (missing.length > 0) {
    console.warn(
      `Missing Firebase env vars: ${missing.join(', ')}. Copy .env.example to .env and fill in values.`,
    );
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
    storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || undefined,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  };
}

export const COLLECTIONS = {
  users: 'users',
  properties: 'properties',
  units: 'units',
  tenants: 'tenants',
  leases: 'leases',
  invoices: 'invoices',
  payments: 'payments',
  maintenanceRequests: 'maintenanceRequests',
  activities: 'activities',
  notices: 'notices',
  technicians: 'technicians',
  paymentMethods: 'paymentMethods',
} as const;
