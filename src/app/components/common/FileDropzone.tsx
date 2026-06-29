import { useCallback, useRef, useState } from 'react';
import { Upload, FileImage, X } from 'lucide-react';
import { cn } from '../ui/utils';

interface FileDropzoneProps {
  accept?: string;
  maxSizeMb?: number;
  value?: File | null;
  onChange: (file: File | null) => void;
  label?: string;
  hint?: string;
  className?: string;
}

export function FileDropzone({
  accept = 'image/jpeg,image/png,image/webp,application/pdf',
  maxSizeMb = 2,
  value,
  onChange,
  label = 'Upload receipt',
  hint = 'Drag & drop or click to browse (JPEG, PNG, WebP, PDF)',
  className,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback(
    (file: File): boolean => {
      const maxBytes = maxSizeMb * 1024 * 1024;
      if (file.size > maxBytes) {
        setError(`File must be under ${maxSizeMb}MB.`);
        return false;
      }
      const accepted = accept.split(',').map((t) => t.trim());
      const ok = accepted.some(
        (t) =>
          t === file.type ||
          (t.endsWith('/*') && file.type.startsWith(t.replace('/*', '/'))),
      );
      if (!ok) {
        setError('File type not supported.');
        return false;
      }
      setError(null);
      return true;
    },
    [accept, maxSizeMb],
  );

  const handleFile = (file: File | null) => {
    if (!file) {
      onChange(null);
      return;
    }
    if (validate(file)) onChange(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className={className}>
      {label && <p className="text-sm font-medium mb-1.5">{label}</p>}
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 sm:p-6 cursor-pointer transition-colors',
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/30',
          value && 'border-solid border-primary/30 bg-primary/5',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        {value ? (
          <>
            <FileImage className="w-8 h-8 text-primary" />
            <p className="text-sm font-medium text-center truncate max-w-full px-2">
              {value.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {(value.size / 1024).toFixed(0)} KB
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
                setError(null);
              }}
              className="absolute top-2 right-2 p-1 rounded-md hover:bg-muted"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">{hint}</p>
          </>
        )}
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
