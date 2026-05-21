# Firestore Schema

## Collections

### `users` (document ID = Auth UID)

| Field | Type | Description |
|-------|------|-------------|
| email | string | Login email |
| firstName | string | |
| lastName | string | |
| phone | string? | |
| role | `admin` \| `tenant` | Access control |
| tenantId | string? | Link to `tenants` for tenant role |
| photoUrl | string? | Profile image URL |
| notificationEmail | boolean | |
| notificationSms | boolean | |
| twoFactorEnabled | boolean | |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### `properties`

| Field | Type |
|-------|------|
| name | string |
| address | string |
| slug | string |
| units | number |
| occupied | number |
| revenue | number |
| status | `active` \| `maintenance` |

### `units`

| Field | Type |
|-------|------|
| propertyId | string → properties |
| unitNumber | string |
| status | `vacant` \| `occupied` \| `maintenance` |
| tenantId | string? |
| leaseId | string? |

### `tenants`

| Field | Type |
|-------|------|
| userId | string? → Auth UID |
| name | string |
| email | string |
| phone | string |
| propertyId | string |
| unitId | string |
| propertyName | string |
| unitLabel | string |
| rent | number |
| status | `active` \| `inactive` |
| paymentStatus | `paid` \| `pending` \| `overdue` |

### `leases`

| Field | Type |
|-------|------|
| tenantId | string |
| propertyId | string |
| unitId | string |
| tenantName | string |
| propertyName | string |
| unitLabel | string |
| startDate | string (ISO date) |
| endDate | string |
| rent | number |
| deposit | number |
| status | `active` \| `expired` \| `pending` \| `terminated` |
| documentPath | string? |

### `invoices`

| Field | Type |
|-------|------|
| invoiceNumber | string |
| tenantId | string |
| tenantName | string |
| unitId | string |
| unitLabel | string |
| propertyId | string |
| amount | number |
| dueDate | string |
| paidDate | string \| null |
| status | `paid` \| `pending` \| `overdue` |
| method | string \| null |
| lateFee | number? |

### `payments`

| Field | Type |
|-------|------|
| tenantId | string |
| invoiceId | string |
| amount | number |
| method | string |
| status | `completed` \| `failed` \| `pending` |
| gateway | `demo` \| `stripe` |
| monthLabel | string? |

### `maintenanceRequests`

| Field | Type |
|-------|------|
| tenantId | string |
| tenantName | string |
| unitId | string |
| unitLabel | string |
| propertyId | string |
| issue | string |
| description | string? |
| category | string |
| priority | `low` \| `medium` \| `high` |
| status | `submitted` \| `assigned` \| `in_progress` \| `completed` |
| submitted | string |
| assignedTo | string \| null |
| photoUrls | string[]? |

#### Subcollection: `maintenanceRequests/{id}/updates`

| Field | Type |
|-------|------|
| date | string |
| message | string |
| status | string |

### `activities`

Dashboard feed events (admin-readable).

### `notices`

Building announcements; optional `propertyId` scope.

### `technicians`

| name | specialties[] | active |

### `paymentMethods`

Saved payment methods per tenant.

## Relationships

```
users (tenant) ──tenantId──► tenants
tenants ──propertyId──► properties
tenants ──unitId──► units
leases ──tenantId, propertyId, unitId
invoices ──tenantId
payments ──tenantId, invoiceId
maintenanceRequests ──tenantId
```

## Composite indexes

Defined in `firestore.indexes.json`:

- `invoices`: tenantId + dueDate
- `maintenanceRequests`: tenantId + submitted
- `payments`: tenantId + createdAt
- `notices`: propertyId + effectiveDate
