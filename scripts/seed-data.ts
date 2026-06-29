export const SEED_USERS = [
  {
    email: 'admin@smartlease.demo',
    password: 'Admin123!',
    role: 'admin' as const,
    firstName: 'Admin',
    lastName: 'User',
    phone: '+1 (555) 000-0001',
  },
  {
    email: 'john.smith@demo.com',
    password: 'Tenant123!',
    role: 'tenant' as const,
    firstName: 'John',
    lastName: 'Smith',
    phone: '+1 (555) 123-4567',
    tenantKey: 'john',
  },
  {
    email: 'sarah.johnson@demo.com',
    password: 'Tenant123!',
    role: 'tenant' as const,
    firstName: 'Sarah',
    lastName: 'Johnson',
    phone: '+1 (555) 234-5678',
    tenantKey: 'sarah',
  },
  {
    email: 'michael.brown@demo.com',
    password: 'Tenant123!',
    role: 'tenant' as const,
    firstName: 'Michael',
    lastName: 'Brown',
    phone: '+1 (555) 345-6789',
    tenantKey: 'michael',
  },
  {
    email: 'emily.davis@demo.com',
    password: 'Tenant123!',
    role: 'tenant' as const,
    firstName: 'Emily',
    lastName: 'Davis',
    phone: '+1 (555) 456-7890',
    tenantKey: 'emily',
  },
];

export const SEED_PROPERTIES = [
  {
    id: 'prop-sunset',
    name: 'Sunset Apartments',
    address: '123 Main St, New York, NY',
    slug: 'sunset',
    units: 24,
    occupied: 22,
    revenue: 28800,
    status: 'active',
  },
  {
    id: 'prop-downtown',
    name: 'Downtown Plaza',
    address: '456 Park Ave, New York, NY',
    slug: 'downtown',
    units: 18,
    occupied: 18,
    revenue: 32400,
    status: 'active',
  },
  {
    id: 'prop-riverside',
    name: 'Riverside Condos',
    address: '789 River Rd, Brooklyn, NY',
    slug: 'riverside',
    units: 32,
    occupied: 28,
    revenue: 42000,
    status: 'active',
  },
  {
    id: 'prop-garden',
    name: 'Garden Heights',
    address: '321 Garden St, Queens, NY',
    slug: 'garden',
    units: 16,
    occupied: 14,
    revenue: 19200,
    status: 'maintenance',
  },
];

const OCCUPIED_UNIT_SPECS = [
  { id: 'unit-sunset-101', propertyId: 'prop-sunset', unitNumber: '1', tenantKey: 'john' },
  { id: 'unit-sunset-204', propertyId: 'prop-sunset', unitNumber: '2', tenantKey: 'david' },
  { id: 'unit-downtown-205', propertyId: 'prop-downtown', unitNumber: '1', tenantKey: 'sarah' },
  { id: 'unit-downtown-403', propertyId: 'prop-downtown', unitNumber: '2', tenantKey: 'robert' },
  { id: 'unit-riverside-312', propertyId: 'prop-riverside', unitNumber: '1', tenantKey: 'michael' },
  { id: 'unit-garden-108', propertyId: 'prop-garden', unitNumber: '1', tenantKey: 'emily' },
];

function buildSeedUnits() {
  const units: Array<{
    id: string;
    propertyId: string;
    unitNumber: string;
    status: 'vacant' | 'occupied';
    tenantKey?: string;
  }> = [];

  for (const prop of SEED_PROPERTIES) {
    const occupiedForProp = OCCUPIED_UNIT_SPECS.filter((o) => o.propertyId === prop.id);
    const occupiedByNumber = new Map(occupiedForProp.map((o) => [o.unitNumber, o]));

    for (let i = 1; i <= prop.units; i++) {
      const unitNumber = String(i);
      const spec = occupiedByNumber.get(unitNumber);
      if (spec) {
        units.push({
          id: spec.id,
          propertyId: prop.id,
          unitNumber,
          status: 'occupied',
          tenantKey: spec.tenantKey,
        });
      } else {
        units.push({
          id: `unit-${prop.slug}-${unitNumber}`,
          propertyId: prop.id,
          unitNumber,
          status: 'vacant',
        });
      }
    }
  }

  return units;
}

export const SEED_UNITS = buildSeedUnits();

export const SEED_TENANTS = [
  {
    id: 'tenant-john',
    key: 'john',
    name: 'John Smith',
    email: 'john.smith@demo.com',
    phone: '+1 (555) 123-4567',
    propertyId: 'prop-sunset',
    unitId: 'unit-sunset-101',
    propertyName: 'Sunset Apartments',
    unitLabel: 'Sunset Apartments - Unit 1',
    rent: 1200,
    status: 'active',
    paymentStatus: 'paid',
  },
  {
    id: 'tenant-sarah',
    key: 'sarah',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@demo.com',
    phone: '+1 (555) 234-5678',
    propertyId: 'prop-downtown',
    unitId: 'unit-downtown-205',
    propertyName: 'Downtown Plaza',
    unitLabel: 'Downtown Plaza - Unit 1',
    rent: 1800,
    status: 'active',
    paymentStatus: 'paid',
  },
  {
    id: 'tenant-michael',
    key: 'michael',
    name: 'Michael Brown',
    email: 'michael.brown@demo.com',
    phone: '+1 (555) 345-6789',
    propertyId: 'prop-riverside',
    unitId: 'unit-riverside-312',
    propertyName: 'Riverside Condos',
    unitLabel: 'Riverside Condos - Unit 1',
    rent: 1500,
    status: 'active',
    paymentStatus: 'pending',
  },
  {
    id: 'tenant-emily',
    key: 'emily',
    name: 'Emily Davis',
    email: 'emily.davis@demo.com',
    phone: '+1 (555) 456-7890',
    propertyId: 'prop-garden',
    unitId: 'unit-garden-108',
    propertyName: 'Garden Heights',
    unitLabel: 'Garden Heights - Unit 1',
    rent: 950,
    status: 'active',
    paymentStatus: 'overdue',
  },
  {
    id: 'tenant-david',
    key: 'david',
    name: 'David Wilson',
    email: 'david.w@email.com',
    phone: '+1 (555) 567-8901',
    propertyId: 'prop-sunset',
    unitId: 'unit-sunset-204',
    propertyName: 'Sunset Apartments',
    unitLabel: 'Sunset Apartments - Unit 2',
    rent: 1350,
    status: 'inactive',
    paymentStatus: 'paid',
  },
  {
    id: 'tenant-robert',
    key: 'robert',
    name: 'Robert Taylor',
    email: 'robert.t@email.com',
    phone: '+1 (555) 678-9012',
    propertyId: 'prop-downtown',
    unitId: 'unit-downtown-403',
    propertyName: 'Downtown Plaza',
    unitLabel: 'Downtown Plaza - Unit 2',
    rent: 1350,
    status: 'active',
    paymentStatus: 'pending',
  },
];

export const SEED_INVOICES = [
  { id: 'inv-001', invoiceNumber: 'INV-001', tenantKey: 'john', unitLabel: 'Unit 1', amount: 1200, dueDate: '2026-05-01', paidDate: '2026-04-28', status: 'paid', method: 'Bank Transfer' },
  { id: 'inv-002', invoiceNumber: 'INV-002', tenantKey: 'sarah', unitLabel: 'Unit 1', amount: 1800, dueDate: '2026-05-01', paidDate: '2026-05-01', status: 'paid', method: 'Credit Card' },
  { id: 'inv-003', invoiceNumber: 'INV-003', tenantKey: 'michael', unitLabel: 'Unit 1', amount: 1500, dueDate: '2026-05-01', paidDate: null, status: 'pending', method: null },
  { id: 'inv-004', invoiceNumber: 'INV-004', tenantKey: 'emily', unitLabel: 'Unit 1', amount: 950, dueDate: '2026-04-25', paidDate: null, status: 'overdue', method: null, lateFee: 50 },
  { id: 'inv-005', invoiceNumber: 'INV-005', tenantKey: 'robert', unitLabel: 'Unit 2', amount: 1350, dueDate: '2026-05-05', paidDate: null, status: 'pending', method: null },
];

export const SEED_MAINTENANCE = [
  { id: 'mnt-001', tenantKey: 'sarah', unitLabel: 'Unit 1', issue: 'Leaking faucet in kitchen', priority: 'medium', status: 'in_progress', submitted: '2026-05-05', assignedTo: 'Mike Williams', category: 'Plumbing' },
  { id: 'mnt-002', tenantKey: 'john', unitLabel: 'Unit 1', issue: 'AC not cooling properly', priority: 'high', status: 'submitted', submitted: '2026-05-06', assignedTo: null, category: 'HVAC' },
  { id: 'mnt-003', tenantKey: 'michael', unitLabel: 'Unit 1', issue: 'Light fixture replacement', priority: 'low', status: 'assigned', submitted: '2026-05-04', assignedTo: 'Tom Anderson', category: 'Electrical' },
  { id: 'mnt-004', tenantKey: 'emily', unitLabel: 'Unit 1', issue: 'Broken window lock', priority: 'medium', status: 'completed', submitted: '2026-05-01', assignedTo: 'Steve Rogers', category: 'General' },
];

export const SEED_TECHNICIANS = [
  { id: 'tech-mike', name: 'Mike Williams', specialties: ['Plumbing'], active: true },
  { id: 'tech-tom', name: 'Tom Anderson', specialties: ['Electrical'], active: true },
  { id: 'tech-steve', name: 'Steve Rogers', specialties: ['General', 'HVAC'], active: true },
];

export const SEED_ACTIVITIES = [
  { type: 'payment', tenantKey: 'john', action: 'Paid rent', amount: '₱1,200', status: 'success' },
  { type: 'maintenance', tenantKey: 'sarah', action: 'Submitted maintenance request', status: 'pending' },
  { type: 'lease', tenantKey: 'michael', action: 'Lease renewed', status: 'success' },
  { type: 'payment', tenantKey: 'emily', action: 'Payment overdue', amount: '₱950', status: 'danger' },
];

export const SEED_NOTICES = [
  {
    id: 'notice-1',
    title: 'Building Maintenance',
    body: 'Scheduled maintenance on May 15, 2026. Water may be shut off 9 AM–12 PM.',
    propertyId: 'prop-sunset',
    effectiveDate: '2026-05-10',
  },
];
