export type FieldRule = {
  value: unknown;
  label: string;
  required?: boolean;
  validate?: (value: unknown) => string | null;
};

export type FormValidationResult = {
  valid: boolean;
  errors: Record<string, string>;
  firstField: string | null;
  message: string | null;
};

export function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (typeof value === 'number') return Number.isNaN(value);
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function validateFormFields(fields: Record<string, FieldRule>): FormValidationResult {
  const errors: Record<string, string> = {};
  let firstField: string | null = null;

  for (const [key, rule] of Object.entries(fields)) {
    if (rule.required && isEmptyValue(rule.value)) {
      errors[key] = `${rule.label} is required`;
      if (!firstField) firstField = key;
      continue;
    }
    if (rule.validate) {
      const message = rule.validate(rule.value);
      if (message) {
        errors[key] = message;
        if (!firstField) firstField = key;
      }
    }
  }

  const firstErrorKey = Object.keys(errors)[0] ?? null;
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    firstField,
    message: firstErrorKey ? errors[firstErrorKey] : null,
  };
}

export function fieldElementId(fieldKey: string): string {
  return `field-${fieldKey}`;
}

export function focusFirstFieldError(
  errors: Record<string, string>,
  fieldOrder?: string[],
): void {
  const keys = fieldOrder ?? Object.keys(errors);
  const firstKey = keys.find((key) => errors[key]);
  if (!firstKey) return;

  const el = document.getElementById(fieldElementId(firstKey));
  if (!el) return;

  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  if (typeof el.focus === 'function') {
    el.focus({ preventScroll: true });
  }
}

export function clearFieldError(
  errors: Record<string, string>,
  fieldKey: string,
): Record<string, string> {
  if (!errors[fieldKey]) return errors;
  const next = { ...errors };
  delete next[fieldKey];
  return next;
}
