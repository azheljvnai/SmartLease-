import { useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { User, Bell, Lock, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { updateUserProfile, changePassword } from '../../../services/auth.service';
import { fileToDataUrl } from '../../../lib/file-upload';
import { getFirebaseErrorMessage } from '../../../lib/firebase-errors';

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
      toast.success('Photo saved to your profile');
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
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-semibold">Profile</h1>

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            {profile?.photoUrl ? (
              <img src={profile.photoUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-primary" />
            )}
          </div>
          <div>
            <p className="font-semibold">{tenant?.name ?? `${form.firstName} ${form.lastName}`}</p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
            <label className="text-sm text-primary cursor-pointer mt-1 inline-block">
              Upload photo (saved in profile, max 500KB)
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <Input label="Full Name" value={`${form.firstName} ${form.lastName}`} disabled />
          <Input label="Email" value={profile?.email ?? ''} disabled />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          {tenant && (
            <Input label="Unit" value={tenant.unitLabel} disabled />
          )}
          <Button variant="primary" loading={saving} onClick={handleSave}>Save Changes</Button>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold flex items-center gap-2 mb-4"><Bell className="w-5 h-5" /> Notifications</h3>
        <label className="flex items-center gap-2 mb-2">
          <input type="checkbox" checked={form.notificationEmail} onChange={(e) => setForm({ ...form, notificationEmail: e.target.checked })} />
          Email notifications
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.notificationSms} onChange={(e) => setForm({ ...form, notificationSms: e.target.checked })} />
          SMS notifications
        </label>
      </Card>

      <Card>
        <h3 className="font-semibold flex items-center gap-2 mb-4"><Lock className="w-5 h-5" /> Security</h3>
        <Input label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <Button variant="outline" className="mt-2" onClick={handlePassword}>Change Password</Button>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="w-4 h-4" />
          Two-factor authentication: {form.twoFactorEnabled ? 'Enabled' : 'Disabled (UI placeholder)'}
        </div>
      </Card>

      <Button variant="destructive" onClick={handleLogout}>Log Out</Button>
    </div>
  );
};
