import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { Button } from '../../ui/button';
import {
  MoreHorizontal,
  Eye,
  Pencil,
  FileText,
  Download,
  Upload,
  RefreshCw,
  Mail,
  RotateCcw,
  Ban,
  Trash2,
} from 'lucide-react';
import type { Lease } from '../../../../types';
import { canRegeneratePdf } from '../../../../lib/lease-documents';
import { getLeaseLifecycleStatus } from '../../../../lib/lease-utils';

export type LeaseAction =
  | 'view'
  | 'edit'
  | 'generatePdf'
  | 'download'
  | 'uploadSigned'
  | 'preview'
  | 'email'
  | 'regenerate'
  | 'renew'
  | 'terminate'
  | 'delete';

interface Props {
  lease: Lease;
  onAction: (action: LeaseAction, lease: Lease) => void;
  loading?: boolean;
}

export function LeaseActionsMenu({ lease, onAction, loading }: Props) {
  const lifecycle = getLeaseLifecycleStatus(lease);
  const hasUnsigned = Boolean(lease.documents?.unsigned);
  const hasSigned = Boolean(lease.documents?.signed);
  const canDelete = lifecycle === 'draft' && !hasSigned;
  const canTerminate = lease.status === 'active' || lifecycle === 'signed';
  const canRenew =
    lease.status === 'active' ||
    lease.status === 'expired' ||
    lifecycle === 'expired' ||
    lifecycle === 'active';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={loading}>
          <MoreHorizontal className="w-4 h-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onAction('view', lease)}>
          <Eye className="w-4 h-4" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('edit', lease)}>
          <Pencil className="w-4 h-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {!hasUnsigned && lifecycle === 'draft' && (
          <DropdownMenuItem onClick={() => onAction('generatePdf', lease)}>
            <FileText className="w-4 h-4" />
            Generate PDF
          </DropdownMenuItem>
        )}
        {hasUnsigned && (
          <DropdownMenuItem onClick={() => onAction('preview', lease)}>
            <Eye className="w-4 h-4" />
            Preview Lease
          </DropdownMenuItem>
        )}
        {(hasUnsigned || hasSigned) && (
          <DropdownMenuItem onClick={() => onAction('download', lease)}>
            <Download className="w-4 h-4" />
            Download Lease
          </DropdownMenuItem>
        )}
        {hasUnsigned && canRegeneratePdf(lease.documentStatus) && (
          <DropdownMenuItem onClick={() => onAction('regenerate', lease)}>
            <RefreshCw className="w-4 h-4" />
            Regenerate PDF
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onAction('email', lease)}>
          <Mail className="w-4 h-4" />
          Email Lease
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('uploadSigned', lease)}>
          <Upload className="w-4 h-4" />
          Upload Signed Copy
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {canRenew && (
          <DropdownMenuItem onClick={() => onAction('renew', lease)}>
            <RotateCcw className="w-4 h-4" />
            Renew
          </DropdownMenuItem>
        )}
        {canTerminate && (
          <DropdownMenuItem onClick={() => onAction('terminate', lease)} className="text-destructive">
            <Ban className="w-4 h-4" />
            Terminate
          </DropdownMenuItem>
        )}
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onAction('delete', lease)} className="text-destructive">
              <Trash2 className="w-4 h-4" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
