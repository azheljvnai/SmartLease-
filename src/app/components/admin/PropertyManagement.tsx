import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Building2, Plus, Search, MapPin, Home, DollarSign, ChevronRight } from 'lucide-react';

const properties = [
  {
    id: 1,
    name: 'Sunset Apartments',
    address: '123 Main St, New York, NY',
    units: 24,
    occupied: 22,
    revenue: 28800,
    status: 'active',
  },
  {
    id: 2,
    name: 'Downtown Plaza',
    address: '456 Park Ave, New York, NY',
    units: 18,
    occupied: 18,
    revenue: 32400,
    status: 'active',
  },
  {
    id: 3,
    name: 'Riverside Condos',
    address: '789 River Rd, Brooklyn, NY',
    units: 32,
    occupied: 28,
    revenue: 42000,
    status: 'active',
  },
  {
    id: 4,
    name: 'Garden Heights',
    address: '321 Garden St, Queens, NY',
    units: 16,
    occupied: 14,
    revenue: 19200,
    status: 'maintenance',
  },
];

export const PropertyManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-foreground mb-1">Properties</h1>
          <p className="text-sm lg:text-base text-muted-foreground">Manage all your properties and units</p>
        </div>
        <Button variant="primary" className="flex items-center gap-2 w-full sm:w-auto">
          <Plus className="w-5 h-5" />
          Add Property
        </Button>
      </div>

      {/* Search and filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search properties..."
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
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Property</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Location</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Units</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Occupancy</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Revenue/mo</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProperties.map((property) => {
                const occupancyRate = Math.round((property.occupied / property.units) * 100);
                return (
                  <tr key={property.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{property.name}</p>
                          <p className="text-sm text-muted-foreground">ID: #{property.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{property.address}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-foreground">{property.units} units</p>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-foreground mb-1">
                          {property.occupied}/{property.units}
                        </p>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${occupancyRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">${property.revenue.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={property.status === 'active' ? 'success' : 'warning'}>
                        {property.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile card view */}
      <div className="lg:hidden space-y-4">
        {filteredProperties.map((property) => {
          const occupancyRate = Math.round((property.occupied / property.units) * 100);
          return (
            <Card key={property.id} hover className="cursor-pointer">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{property.name}</h3>
                    <Badge variant={property.status === 'active' ? 'success' : 'warning'}>
                      {property.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{property.address}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Units</p>
                  <p className="font-semibold text-foreground">{property.units}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Occupied</p>
                  <p className="font-semibold text-foreground">{property.occupied}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Revenue/mo</p>
                  <p className="font-semibold text-foreground">${(property.revenue / 1000).toFixed(0)}K</p>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Occupancy Rate</span>
                  <span className="font-medium text-foreground">{occupancyRate}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${occupancyRate}%` }}
                  />
                </div>
              </div>

              <Button variant="outline" size="sm" className="w-full justify-between">
                View Details
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
