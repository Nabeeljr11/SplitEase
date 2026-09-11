import React from 'react';
import { clsx } from 'clsx';

export interface BadgeProps {
  variant?: 'positive' | 'negative' | 'neutral' | 'outline';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  children,
  className,
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full select-none';

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] leading-tight',
    md: 'px-2.5 py-1 text-xs leading-tight',
  };

  const variantStyles = {
    positive:
      'bg-signal-green-subtle text-signal-green border border-green-500/20 dark:border-green-500/30',
    negative:
      'bg-signal-red-subtle text-signal-red border border-red-500/20 dark:border-red-500/30',
    neutral:
      'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-border-light dark:border-border-dark',
    outline:
      'bg-transparent text-neutral-600 dark:text-neutral-400 border border-border-light dark:border-border-dark',
  };

  return (
    <span className={clsx(baseStyles, sizeStyles[size], variantStyles[variant], className)}>
      {children}
    </span>
  );
};
