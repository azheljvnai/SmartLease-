import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  padding = true,
  hover = false
}) => {
  return (
    <div
      className={cn(
        'bg-card rounded-xl border border-border shadow-sm',
        padding && 'p-4 lg:p-6',
        hover && 'hover:shadow-md transition-shadow duration-200',
        className
      )}
    >
      {children}
    </div>
  );
};
