import React from 'react';
import { Utensils, Plane, Home, Zap, Film, Tag, ArrowRightLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { ExpenseCategory } from '../../types';

export interface CategoryIconProps {
  category: ExpenseCategory | 'SETTLEMENT' | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ category, size = 'md', className }) => {
  const sizeStyles = {
    sm: 'w-7 h-7 p-1.5',
    md: 'w-9 h-9 p-2',
    lg: 'w-11 h-11 p-2.5',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const getIcon = () => {
    const s = iconSizes[size];
    switch (category?.toUpperCase()) {
      case 'FOOD':
        return <Utensils className={s} />;
      case 'TRAVEL':
        return <Plane className={s} />;
      case 'RENT':
        return <Home className={s} />;
      case 'UTILITIES':
        return <Zap className={s} />;
      case 'ENTERTAINMENT':
        return <Film className={s} />;
      case 'SETTLEMENT':
        return <ArrowRightLeft className={s} />;
      default:
        return <Tag className={s} />;
    }
  };

  return (
    <div
      className={clsx(
        'inline-flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-border-light dark:border-border-dark flex-shrink-0',
        sizeStyles[size],
        className
      )}
    >
      {getIcon()}
    </div>
  );
};
