import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Link, useNavigate } from 'react-router';
import {
  DollarSign,
  FileText,
  Wrench,
  Calendar,
  Home,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Download
} from 'lucide-react';

export const TenantHome = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* Welcome section */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold text-foreground mb-1">Welcome back, John!</h1>
        <p className="text-sm text-muted-foreground">Here's your rental overview</p>
      </div>

      {/* Current rent due - Prominent card */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
        <div className="relative">
          <div className="flex items-start justify-between mb-3 lg:mb-4">
            <div>
              <p className="text-primary-foreground/80 text-sm mb-1">Current Rent Due</p>
              <h2 className="text-4xl lg:text-5xl font-bold mb-2">$1,200</h2>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4" />
                <span>Due: May 1, 2026</span>
              </div>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <DollarSign className="w-8 h-8" />
            </div>
          </div>
          <Button
            variant="secondary"
            size="lg"
            className="w-full bg-white text-primary hover:bg-white/90 shadow-lg"
            onClick={() => navigate('/tenant/payments')}
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Pay Now
          </Button>
        </div>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <button
          onClick={() => alert('Lease document viewer would open here')}
          className="text-left"
        >
          <Card padding={false} className="p-4 lg:p-5 hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <FileText className="w-6 h-6 lg:w-7 lg:h-7 text-primary" />
              </div>
              <p className="font-semibold text-foreground text-sm lg:text-base mb-1">View Lease</p>
              <p className="text-xs text-muted-foreground">Check your contract</p>
            </div>
          </Card>
        </button>

        <button
          onClick={() => navigate('/tenant/maintenance')}
          className="text-left"
        >
          <Card padding={false} className="p-4 lg:p-5 hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <Wrench className="w-6 h-6 lg:w-7 lg:h-7 text-primary" />
              </div>
              <p className="font-semibold text-foreground text-sm lg:text-base mb-1">Request Service</p>
              <p className="text-xs text-muted-foreground">Submit a ticket</p>
            </div>
          </Card>
        </button>
      </div>

      {/* Lease summary - Your Unit */}
      <Card className="hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
            <Home className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">Your Unit</h3>
            <p className="text-sm text-muted-foreground">Sunset Apartments - Unit 101</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center py-2.5 border-b border-border">
            <span className="text-sm text-muted-foreground">Monthly Rent</span>
            <span className="font-semibold text-foreground">$1,200</span>
          </div>
          <div className="flex justify-between items-center py-2.5 border-b border-border">
            <span className="text-sm text-muted-foreground">Lease Start</span>
            <span className="font-medium text-foreground">Jan 1, 2026</span>
          </div>
          <div className="flex justify-between items-center py-2.5 border-b border-border">
            <span className="text-sm text-muted-foreground">Lease End</span>
            <span className="font-medium text-foreground">Dec 31, 2026</span>
          </div>
          <div className="flex justify-between items-center py-2.5">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant="success">Active</Badge>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full mt-4"
          onClick={() => alert('Download lease PDF')}
        >
          <Download className="w-4 h-4 mr-2" />
          Download Lease
        </Button>
      </Card>

      {/* Payment history preview */}
      <Card className="hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Recent Payments</h3>
          <Link to="/tenant/payments" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-success/5 border border-success/20 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-success/10 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">April 2026</p>
                <p className="text-xs text-muted-foreground">Paid on Apr 1, 2026</p>
              </div>
            </div>
            <p className="font-semibold text-foreground">$1,200</p>
          </div>

          <div className="flex items-center justify-between p-3 bg-success/5 border border-success/20 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-success/10 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">March 2026</p>
                <p className="text-xs text-muted-foreground">Paid on Mar 1, 2026</p>
              </div>
            </div>
            <p className="font-semibold text-foreground">$1,200</p>
          </div>
        </div>
      </Card>

      {/* Maintenance requests preview */}
      <Card className="hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Maintenance Requests</h3>
          <Link to="/tenant/maintenance" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-2">
          <div className="flex items-start gap-3 p-3 bg-warning/5 border border-warning/20 rounded-lg">
            <div className="w-9 h-9 bg-warning/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Wrench className="w-5 h-5 text-warning" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-semibold text-foreground">AC not cooling properly</p>
                <Badge variant="warning">In Progress</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Submitted 2 days ago • Technician assigned</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => navigate('/tenant/maintenance')}
          >
            <Wrench className="w-4 h-4 mr-2" />
            Submit New Request
          </Button>
        </div>
      </Card>

      {/* Important notices */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-2">Important Notice</h3>
            <p className="text-sm text-foreground/80 mb-3">
              Building maintenance scheduled for May 15th, 2026. Water will be temporarily shut off from 9 AM to 12 PM.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>Posted on May 1, 2026</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
