import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { User, Plus, Search, Mail, Phone, Home, ChevronRight } from 'lucide-react';

const tenants = [
  {
    id: 1,
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1 (555) 123-4567',
    unit: 'Sunset Apartments - Unit 101',
    rent: 1200,
    status: 'active',
    paymentStatus: 'paid',
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '+1 (555) 234-5678',
    unit: 'Downtown Plaza - Unit 205',
    rent: 1800,
    status: 'active',
    paymentStatus: 'paid',
  },
  {
    id: 3,
    name: 'Michael Brown',
    email: 'michael.b@email.com',
    phone: '+1 (555) 345-6789',
    unit: 'Riverside Condos - Unit 312',
    rent: 1500,
    status: 'active',
    paymentStatus: 'pending',
  },
  {
    id: 4,
    name: 'Emily Davis',
    email: 'emily.davis@email.com',
    phone: '+1 (555) 456-7890',
    unit: 'Garden Heights - Unit 108',
    rent: 950,
    status: 'active',
    paymentStatus: 'overdue',
  },
  {
    id: 5,
    name: 'David Wilson',
    email: 'david.w@email.com',
    phone: '+1 (555) 567-8901',
    unit: 'Sunset Apartments - Unit 204',
    rent: 1350,
    status: 'inactive',
    paymentStatus: 'paid',
  },
];

export const TenantManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.unit.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Paid</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'overdue':
        return <Badge variant="danger">Overdue</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-foreground mb-1">Tenants</h1>
          <p className="text-sm lg:text-base text-muted-foreground">Manage tenant information and communications</p>
        </div>
        <Button variant="primary" className="flex items-center gap-2 w-full sm:w-auto">
          <Plus className="w-5 h-5" />
          Add Tenant
        </Button>
      </div>

      {/* Search and filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tenants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="md">
              All Status
            </Button>
            <Button variant="outline" size="md">
              Filter
            </Button>
          </div>
        </div>
      </Card>

      {/* Desktop table view */}
      <Card padding={false} className="hidden lg:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Tenant</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Contact</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Unit</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Rent</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Payment Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary">
                          {tenant.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{tenant.name}</p>
                        <p className="text-sm text-muted-foreground">ID: #{tenant.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{tenant.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{tenant.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{tenant.unit}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">${tenant.rent.toLocaleString()}/mo</p>
                  </td>
                  <td className="px-6 py-4">
                    {getPaymentBadge(tenant.paymentStatus)}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={tenant.status === 'active' ? 'success' : 'default'}>
                      {tenant.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="sm">
                      View Profile
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile card view */}
      <div className="lg:hidden space-y-4">
        {filteredTenants.map((tenant) => (
          <Card key={tenant.id} hover className="cursor-pointer">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="font-medium text-primary">
                  {tenant.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">{tenant.name}</h3>
                  {getPaymentBadge(tenant.paymentStatus)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{tenant.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{tenant.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Home className="w-4 h-4" />
              <span>{tenant.unit}</span>
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Monthly Rent</span>
              <span className="font-semibold text-foreground">${tenant.rent.toLocaleString()}/mo</span>
            </div>

            <Button variant="outline" size="sm" className="w-full justify-between">
              View Profile
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};
