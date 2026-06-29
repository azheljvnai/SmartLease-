import { useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import {
  Bell,
  Shield,
  Building2,
  Phone,
  Mail,
  LogOut,
  Camera,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { updateUserProfile, changePassword } from '../../../services/auth.service';
import { fileToDataUrl } from '../../../lib/file-upload';
import { getFirebaseErrorMessage } from '../../../lib/firebase-errors';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { TenantPageHeader } from './shared/TenantPageHeader';
import { TenantSection } from './shared/TenantSection';

export const TenantProfile = () => {
  const navigate = useNavigate();
  const { user, profile, tenant, signOut, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: profile?.firstName ?? '',
    lastName: profile?.lastName ?? '',
    phone: profile?.phone ?? '',
    notificationEmail: profile?.notificationEmail ?? true,
    notificationSms: profile?.notificationSms ?? false,
    twoFactorEnabled: profile?.twoFactorEnabled ?? false,
  });
  const [newPassword, setNewPassword] = useState('');

  const initials = (() => {
    if (tenant?.name) {
      return tenant.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    }
    const fromForm = `${form.firstName[0] ?? ''}${form.lastName[0] ?? ''}`.toUpperCase();
    return fromForm || 'TN';
  })();

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, form);
      await refreshProfile();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const photoUrl = await fileToDataUrl(file);
      await updateUserProfile(user.uid, { photoUrl });
      await refreshProfile();
      toast.success('Photo updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save photo');
    }
  };

  const handlePassword = async () => {
    if (!user || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await changePassword(user, newPassword);
      toast.success('Password updated');
      setNewPassword('');
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <TenantPageHeader
        title="Profile"
        description="Manage your account, notifications, and security settings"
      />

      {/* Profile header card */}
      <Card padding={false} className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-5 py-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="relative">
              <Avatar className="h-20 w-20 border-2 border-background shadow-md">
                {profile?.photoUrl && <AvatarImage src={profile.photoUrl} alt="" />}
                <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="photo-upload"
                className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                <Camera className="h-3.5 w-3.5" />
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhoto}
                />
              </label>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-semibold">
                {tenant?.name ?? `${form.firstName} ${form.lastName}`}
              </h2>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              {tenant && (
                <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
                  <Building2 className="h-3.5 w-3.5" />
                  {tenant.propertyName} · {tenant.unitLabel}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      <TenantSection title="Personal Information" description="Your contact details">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="First Name" value={form.firstName} disabled />
            <Input label="Last Name" value={form.lastName} disabled />
          </div>
          <Input label="Email" value={profile?.email ?? ''} disabled />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+63 9XX XXX XXXX"
          />
          {tenant && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Property" value={tenant.propertyName} disabled />
              <Input label="Unit" value={tenant.unitLabel} disabled />
            </div>
          )}
          <Button variant="primary" loading={saving} onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </TenantSection>

      <TenantSection title="Notifications" description="Choose how you receive updates">
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div>
                <Label htmlFor="notif-email" className="font-medium">
                  Email notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Payment reminders, lease updates, and announcements
                </p>
              </div>
            </div>
            <Switch
              id="notif-email"
              checked={form.notificationEmail}
              onCheckedChange={(v) => setForm({ ...form, notificationEmail: v })}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <Label htmlFor="notif-sms" className="font-medium">
                  SMS notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Urgent alerts and payment confirmations
                </p>
              </div>
            </div>
            <Switch
              id="notif-sms"
              checked={form.notificationSms}
              onCheckedChange={(v) => setForm({ ...form, notificationSms: v })}
            />
          </div>
        </div>
      </TenantSection>

      <TenantSection title="Security" description="Password and account protection">
        <div className="space-y-4">
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
          <Button variant="outline" onClick={handlePassword}>
            Update Password
          </Button>
          <Separator />
          <div className="flex items-center gap-3 rounded-lg bg-muted/40 p-4 text-sm">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Two-factor authentication</p>
              <p className="text-muted-foreground">
                {form.twoFactorEnabled ? 'Enabled' : 'Not enabled'} — coming soon
              </p>
            </div>
          </div>
        </div>
      </TenantSection>

      <Card padding={false} className="p-4">
        <Button
          variant="outline"
          className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </Card>
    </div>
  );
};
