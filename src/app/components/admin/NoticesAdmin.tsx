import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Plus, Megaphone } from 'lucide-react';
import { PageLoader } from '../common/LoadingSpinner';
import { listAllNotices, createNotice } from '../../../services/notices.service';
import { listProperties } from '../../../services/properties.service';
import type { Notice, Property } from '../../../types';
import { getFirebaseErrorMessage } from '../../../lib/firebase-errors';

export const NoticesAdmin = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', propertyId: '', effectiveDate: '' });

  useEffect(() => {
    Promise.all([listAllNotices(), listProperties()]).then(([n, p]) => {
      setNotices(n);
      setProperties(p);
      setLoading(false);
    });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createNotice({
        title: form.title,
        body: form.body,
        effectiveDate: form.effectiveDate,
        ...(form.propertyId ? { propertyId: form.propertyId } : {}),
      });
      const updated = await listAllNotices();
      setNotices(updated);
      toast.success('Notice published');
      setShowForm(false);
      setForm({ title: '', body: '', propertyId: '', effectiveDate: '' });
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-foreground mb-1">Notices</h1>
          <p className="text-sm text-muted-foreground">Broadcast announcements to tenants</p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />New Notice</Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <div>
              <label className="text-sm font-medium">Message</label>
              <textarea
                className="w-full mt-1 min-h-24 rounded-md border px-3 py-2 text-sm"
                required
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Property (optional)</label>
              <select className="w-full mt-1 h-9 rounded-md border px-3" value={form.propertyId} onChange={(e) => setForm({ ...form, propertyId: e.target.value })}>
                <option value="">All properties</option>
                {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <Input label="Effective Date" type="date" required value={form.effectiveDate} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} />
            <div className="flex gap-2">
              <Button type="submit" variant="primary" loading={submitting}>Publish</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {notices.length === 0 ? (
          <Card><p className="text-muted-foreground text-sm">No notices yet.</p></Card>
        ) : (
          notices.map((n) => (
            <Card key={n.id} className="flex gap-3">
              <Megaphone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{n.title}</h3>
                  <Badge variant="default">{n.effectiveDate}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{n.body}</p>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
