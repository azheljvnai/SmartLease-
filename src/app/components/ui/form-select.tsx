import * as React from 'react';
import { cn } from './utils';
import { FieldLabel } from './field-label';
import { fieldElementId } from '../../../lib/form-validation';

type FormSelectProps = React.ComponentProps<'select'> & {
  label?: string;
  error?: string;
  fieldKey?: string;
  showOptional?: boolean;
};

const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ className, label, error, fieldKey, id, required, showOptional, children, ...props }, ref) => {
    const selectId =
      id ?? (fieldKey ? fieldElementId(fieldKey) : label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const select = (
      <select
        ref={ref}
        id={selectId}
        aria-invalid={!!error}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm transition-[color,box-shadow] outline-none',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        required={required}
        {...props}
      >
        {children}
      </select>
    );

    if (!label && !error) return select;

    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <FieldLabel
            htmlFor={selectId}
            label={label}
            required={required}
            showOptional={showOptional}
          />
        )}
        {select}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  },
);

FormSelect.displayName = 'FormSelect';

export { FormSelect };
