import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useNavigate } from 'react-router';
import { User, Mail, Phone, Home, Lock, Bell, LogOut, CheckCircle2 } from 'lucide-react';

export const TenantProfile = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-2xl lg:max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold text-foreground mb-1">Profile</h1>
        <p className="text-sm lg:text-base text-muted-foreground">Manage your account settings</p>
      </div>

      {/* Profile picture */}
      <Card className="text-center">
        <div className="w-20 h-20 lg:w-24 lg:h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-4">
          <span className="text-2xl lg:text-3xl font-semibold text-primary">JS</span>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">John Smith</h3>
        <p className="text-sm text-muted-foreground mb-3 lg:mb-4">john.smith@email.com</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => alert('Upload photo functionality')}
        >
          <User className="w-4 h-4 mr-2" />
          Change Photo
        </Button>
      </Card>

      {/* Personal Information */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Personal Information</h3>
        </div>
        <div className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            defaultValue="John Smith"
          />
          <Input
            label="Email"
            type="email"
            defaultValue="john.smith@email.com"
          />
          <Input
            label="Phone"
            type="tel"
            defaultValue="+1 (555) 123-4567"
          />
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            onClick={() => alert('Profile updated successfully!')}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </Card>

      {/* Residence Information */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Home className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Residence Information</h3>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Property</span>
            <span className="font-medium text-foreground">Sunset Apartments</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Unit</span>
            <span className="font-medium text-foreground">101</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Move-in Date</span>
            <span className="font-medium text-foreground">Jan 1, 2026</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-muted-foreground">Lease Expires</span>
            <span className="font-medium text-foreground">Dec 31, 2026</span>
          </div>
        </div>
      </Card>

      {/* Security */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Security</h3>
        </div>
        <div className="space-y-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => alert('Change password functionality')}
          >
            <Lock className="w-4 h-4 mr-2" />
            Change Password
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => alert('2FA setup functionality')}
          >
            <Lock className="w-4 h-4 mr-2" />
            Enable Two-Factor Authentication
          </Button>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Notifications</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Payment Reminders</p>
              <p className="text-xs text-muted-foreground">Get notified before rent is due</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-primary" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Maintenance Updates</p>
              <p className="text-xs text-muted-foreground">Updates on your service requests</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-primary" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Property Announcements</p>
              <p className="text-xs text-muted-foreground">Important notices from management</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-primary" />
          </div>
        </div>
      </Card>

      {/* Logout */}
      <Card>
        <Button
          variant="destructive"
          size="md"
          className="w-full justify-start"
          onClick={() => {
            if (confirm('Are you sure you want to logout?')) {
              navigate('/login');
            }
          }}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
      </Card>
    </div>
  );
};
