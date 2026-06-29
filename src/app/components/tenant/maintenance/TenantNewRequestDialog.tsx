import { useState } from 'react';
import { toast } from 'sonner';
import { ImagePlus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { FormSelect } from '../../ui/form-select';
import { createMaintenanceRequest, updateMaintenanceRequest } from '../../../../services/maintenance.service';
import { fileToDataUrl } from '../../../../lib/file-upload';
import { MAINTENANCE_CATEGORIES } from '../../../../lib/maintenance-labels';
import {
  clearFieldError,
  focusFirstFieldError,
  validateFormFields,
} from '../../../../lib/form-validation';
import type { MaintenancePriority, Tenant } from '../../../../types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: Tenant;
}

const MAX_PHOTOS = 5;

export function TenantNewRequestDialog({ open, onOpenChange, tenant }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    issue: '',
    category: 'General',
    description: '',
    priority: 'medium' as MaintenancePriority,
    preferredDate: '',
    preferredTime: '',
  });

  const resetForm = () => {
    setForm({
      issue: '',
      category: 'General',
      description: '',
      priority: 'medium',
      preferredDate: '',
      preferredTime: '',
    });
    setPhotoFiles([]);
    setFieldErrors({});
  };

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (photoFiles.length + files.length > MAX_PHOTOS) {
      toast.error(`Maximum ${MAX_PHOTOS} photos allowed`);
      return;
    }
    const oversized = files.find((f) => f.size > 500_000);
    if (oversized) {
      toast.error('Each image must be under 500KB');
      return;
    }
    setPhotoFiles((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateFormFields({
      issue: { value: form.issue, label: 'Issue summary', required: true },
      description: { value: form.description, label: 'Description', required: true },
    });
    if (!result.valid) {
      setFieldErrors(result.errors);
      focusFirstFieldError(result.errors);
      toast.error(result.message ?? 'Please fix the highlighted fields');
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      const requestId = await createMaintenanceRequest({
        tenantId: tenant.id,
        tenantName: tenant.name,
        unitId: tenant.unitId,
        unitLabel: tenant.unitLabel,
        propertyId: tenant.propertyId,
        propertyName: tenant.propertyName,
        issue: form.issue,
        description: form.description,
        category: form.category,
        priority: form.priority,
        status: 'requested',
        submitted: new Date().toISOString().split('T')[0],
        assignedTo: null,
        preferredScheduleDate: form.preferredDate || null,
        preferredScheduleTime: form.preferredTime || null,
      });

      if (photoFiles.length > 0) {
        const photoUrls = await Promise.all(photoFiles.map(fileToDataUrl));
        await updateMaintenanceRequest(requestId, { photoUrls }, { skipAutoUpdate: true });
      }

      toast.success('Maintenance request submitted');
      resetForm();
      onOpenChange(false);
    } catch {
      toast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Maintenance Request</DialogTitle>
          <DialogDescription>
            Describe the issue in detail. Our team will review and schedule a repair.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Issue Summary"
            required
            fieldKey="issue"
            error={fieldErrors.issue}
            placeholder="e.g. Leaking kitchen faucet"
            value={form.issue}
            onChange={(e) => {
              setForm({ ...form, issue: e.target.value });
              setFieldErrors((p) => clearFieldError(p, 'issue'));
            }}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormSelect
              label="Category"
              fieldKey="category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {MAINTENANCE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </FormSelect>
            <FormSelect
              label="Priority"
              fieldKey="priority"
              value={form.priority}
              onChange={(e) =>
                setForm({ ...form, priority: e.target.value as MaintenancePriority })
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="emergency">Emergency</option>
            </FormSelect>
          </div>

          <Textarea
            label="Description"
            required
            fieldKey="description"
            error={fieldErrors.description}
            placeholder="Provide details about the issue, location in the unit, and when it started..."
            value={form.description}
            onChange={(e) => {
              setForm({ ...form, description: e.target.value });
              setFieldErrors((p) => clearFieldError(p, 'description'));
            }}
            rows={4}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Preferred date"
              type="date"
              fieldKey="preferredDate"
              value={form.preferredDate}
              onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
            />
            <Input
              label="Preferred time"
              type="time"
              fieldKey="preferredTime"
              value={form.preferredTime}
              onChange={(e) => setForm({ ...form, preferredTime: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              Photos <span className="text-muted-foreground font-normal">(optional, up to {MAX_PHOTOS})</span>
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Attach photos of the issue. Max 500KB each.
            </p>
            {photoFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {photoFiles.map((file, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Upload ${i + 1}`}
                      className="h-16 w-16 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {photoFiles.length < MAX_PHOTOS && (
              <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-xl p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoAdd}
                />
                <ImagePlus className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Add photos</span>
              </label>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
