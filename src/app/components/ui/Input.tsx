import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block mb-2 text-sm text-foreground">
          {label}
        </label>
      )}
      <input
        className={cn(
          'w-full px-4 py-2.5 bg-input-background border border-input rounded-lg',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          'transition-all duration-200',
          'placeholder:text-muted-foreground',
          error && 'border-destructive focus:ring-destructive',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};
