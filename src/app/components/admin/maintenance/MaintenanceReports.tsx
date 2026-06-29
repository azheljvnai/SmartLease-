import { useState } from 'react';
import { toast } from 'sonner';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { FileSpreadsheet, FileText, Download } from 'lucide-react';
import type { Property } from '../../../../types';
import {
  exportMaintenanceReportExcel,
  exportMaintenanceReportPdf,
  type MaintenanceReportKind,
} from '../../../../services/maintenance-report.service';
import { getFirebaseErrorMessage } from '../../../../lib/firebase-errors';

const REPORTS: { kind: MaintenanceReportKind; title: string; description: string }[] = [
  { kind: 'summary', title: 'Maintenance Summary', description: 'Overview of all work orders and KPIs' },
  { kind: 'technician_performance', title: 'Technician Performance', description: 'Jobs completed, resolution time, and costs by technician' },
  { kind: 'costs', title: 'Maintenance Costs', description: 'Labor, materials, and payment breakdown' },
  { kind: 'property_history', title: 'Property Maintenance History', description: 'All requests for a selected property' },
  { kind: 'monthly', title: 'Monthly Maintenance Report', description: 'Current month activity and completions' },
  { kind: 'outstanding', title: 'Outstanding Work Orders', description: 'Open orders with days outstanding' },
];

interface Props {
  properties: Property[];
}

export function MaintenanceReports({ properties }: Props) {
  const [propertyId, setPropertyId] = useState('all');
  const [exporting, setExporting] = useState<string | null>(null);

  const runExport = async (kind: MaintenanceReportKind, format: 'pdf' | 'excel') => {
    const key = `${kind}-${format}`;
    setExporting(key);
    try {
      const propId = kind === 'property_history' && propertyId !== 'all' ? propertyId : undefined;
      if (format === 'pdf') await exportMaintenanceReportPdf(kind, propId);
      else exportMaintenanceReportExcel(kind, propId);
      toast.success('Report downloaded');
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Maintenance Reports</h2>
        <p className="text-sm text-muted-foreground">Export professionally formatted PDF and Excel reports</p>
      </div>

      <Card className="p-3">
        <label className="text-sm font-medium">Property (for Property History report)</label>
        <select
          className="w-full mt-1 h-9 border rounded-md px-3 text-sm bg-background max-w-md"
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
        >
          <option value="all">All Properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </Card>

      <div className="grid sm:grid-cols-2 gap-3">
        {REPORTS.map((report) => (
          <Card key={report.kind} className="p-4 flex flex-col">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">{report.title}</h3>
                <p className="text-sm text-muted-foreground">{report.description}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-auto">
              <Button
                size="sm"
                variant="outline"
                loading={exporting === `${report.kind}-pdf`}
                onClick={() => runExport(report.kind, 'pdf')}
              >
                <FileText className="w-4 h-4 mr-1" />PDF
              </Button>
              <Button
                size="sm"
                variant="outline"
                loading={exporting === `${report.kind}-excel`}
                onClick={() => runExport(report.kind, 'excel')}
              >
                <FileSpreadsheet className="w-4 h-4 mr-1" />Excel
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
