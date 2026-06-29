import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { QrCode, Save, Upload } from 'lucide-react';
import {
  getPaymentInstructions,
  getDefaultPaymentInstructions,
  updatePaymentInstruction,
  uploadPaymentQrCode,
  resolveQrImageUrl,
} from '../../../services/payment-settings.service';
import type { PaymentInstructionEntry, PaymentInstructionsSettings } from '../../../types';
import { getFirebaseErrorMessage } from '../../../lib/firebase-errors';

type MethodKey = 'qrph' | 'gcash' | 'maya';

const METHODS: { key: MethodKey; label: string }[] = [
  { key: 'qrph', label: 'QR Ph' },
  { key: 'gcash', label: 'GCash' },
  { key: 'maya', label: 'Maya' },
];

function MethodEditor({
  methodKey,
  label,
  entry,
  onSave,
  onUploadQr,
  saving,
}: {
  methodKey: MethodKey;
  label: string;
  entry: PaymentInstructionEntry;
  onSave: (key: MethodKey, data: Partial<PaymentInstructionEntry>) => Promise<void>;
  onUploadQr: (key: MethodKey, file: File) => Promise<void>;
  saving: string | null;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(entry);
  const qrUrl = resolveQrImageUrl(entry);
  const isSaving = saving === methodKey;

  useEffect(() => {
    setForm(entry);
  }, [entry]);

  return (
    <Card className="p-4 space-y-3">
      <h4 className="font-semibold flex items-center gap-2">
        <QrCode className="w-4 h-4" />
        {label}
      </h4>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="shrink-0 w-full sm:w-40">
          {qrUrl ? (
            <img
              src={qrUrl}
              alt={`${label} QR`}
              className="w-full max-w-[160px] aspect-square object-contain rounded-lg border bg-white p-2 mx-auto sm:mx-0"
            />
          ) : (
            <div className="w-full max-w-[160px] aspect-square rounded-lg border border-dashed flex items-center justify-center bg-muted/30 mx-auto sm:mx-0">
              <p className="text-xs text-muted-foreground text-center px-2">No QR uploaded</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) await onUploadQr(methodKey, file);
              e.target.value = '';
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full mt-2"
            loading={isSaving}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Upload QR Image
          </Button>
        </div>

        <div className="flex-1 space-y-2">
          <Input
            label="Account Name"
            value={form.accountName}
            onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
            placeholder="e.g. Property Management Inc."
          />
          <Input
            label="Account Number"
            value={form.accountNumber}
            onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
            placeholder="Mobile no. or account no."
          />
          <Textarea
            label="Payment Instructions"
            value={form.instructions}
            onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
            rows={3}
            placeholder="Brief steps for the tenant..."
          />
          <Button
            variant="primary"
            size="sm"
            loading={isSaving}
            onClick={() => onSave(methodKey, form)}
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Save {label}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function PaymentInstructionsSettings() {
  const [settings, setSettings] = useState<PaymentInstructionsSettings>(getDefaultPaymentInstructions);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoadError(null);
    try {
      const data = await getPaymentInstructions();
      setSettings(data);
    } catch (err) {
      setLoadError(getFirebaseErrorMessage(err));
    }
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const handleSave = async (key: MethodKey, data: Partial<PaymentInstructionEntry>) => {
    setSaving(key);
    try {
      await updatePaymentInstruction(key, data);
      await load();
      toast.success('Payment instructions saved.');
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setSaving(null);
    }
  };

  const handleUploadQr = async (key: MethodKey, file: File) => {
    setSaving(key);
    try {
      await uploadPaymentQrCode(key, file);
      await load();
      toast.success('QR code uploaded.');
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground py-4">Loading payment settings...</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Payment QR Codes & Instructions</h2>
        <p className="text-sm text-muted-foreground">
          Upload QR code images and account details. Tenants see these on their Payments page.
        </p>
      </div>

      {loadError && (
        <Card className="p-3 border-amber-200 bg-amber-50/50 text-sm text-amber-900">
          Could not load saved settings: {loadError}. You can still edit and save below.
        </Card>
      )}

      <div className="grid gap-4">
        {METHODS.map((m) => (
          <MethodEditor
            key={m.key}
            methodKey={m.key}
            label={m.label}
            entry={settings[m.key]}
            onSave={handleSave}
            onUploadQr={handleUploadQr}
            saving={saving}
          />
        ))}
      </div>
    </div>
  );
}
