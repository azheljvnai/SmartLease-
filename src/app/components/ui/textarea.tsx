import * as React from 'react';

import { cn } from './utils';
import { FieldLabel } from './field-label';
import { fieldElementId } from '../../../lib/form-validation';

type TextareaProps = React.ComponentProps<'textarea'> & {
  label?: string;
  error?: string;
  fieldKey?: string;
  showOptional?: boolean;
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, fieldKey, id, required, showOptional, ...props }, ref) => {
    const textareaId =
      id ?? (fieldKey ? fieldElementId(fieldKey) : label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const textarea = (
      <textarea
        ref={ref}
        id={textareaId}
        data-slot="textarea"
        aria-invalid={!!error}
        required={required}
        className={cn(
          'resize-none border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-input-background px-3 py-2 text-base transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className,
        )}
        {...props}
      />
    );

    if (!label && !error) return textarea;

    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <FieldLabel
            htmlFor={textareaId}
            label={label}
            required={required}
            showOptional={showOptional}
          />
        )}
        {textarea}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';

export { Textarea };
