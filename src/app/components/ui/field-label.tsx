import { Label } from './label';
import { cn } from './utils';

type FieldLabelProps = {
  htmlFor?: string;
  label: string;
  required?: boolean;
  showOptional?: boolean;
  className?: string;
};

export function FieldLabel({
  htmlFor,
  label,
  required,
  showOptional = !required,
  className,
}: FieldLabelProps) {
  return (
    <Label htmlFor={htmlFor} className={cn('text-foreground', className)}>
      {label}
      {required && (
        <span className="text-destructive ml-0.5" aria-hidden="true">
          *
        </span>
      )}
      {showOptional && !required && (
        <span className="text-muted-foreground font-normal ml-1">(optional)</span>
      )}
    </Label>
  );
}
