import React from 'react';
import { clsx } from 'clsx';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
}: SegmentedControlProps<T>) {
  return (
    <div
      className={clsx(
        'inline-flex p-1 bg-neutral-100 dark:bg-neutral-900 border border-border-light dark:border-border-dark rounded-xl select-none',
        className
      )}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={clsx(
              'flex-1 flex items-center justify-center font-medium rounded-lg transition-all duration-150 btn-press whitespace-nowrap',
              size === 'sm' ? 'px-2.5 py-1 text-xs gap-1.5' : 'px-3 py-1.5 text-sm gap-2',
              isSelected
                ? 'bg-surface-light dark:bg-surface-dark text-neutral-900 dark:text-neutral-100 shadow-sm border border-border-light/80 dark:border-border-dark/80 font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
