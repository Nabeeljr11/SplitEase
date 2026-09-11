import React, { useState } from 'react';
import { Expense, User } from '../../types';
import { CategoryIcon } from '../common/CategoryIcon';
import { Trash2 } from 'lucide-react';

interface ExpenseRowProps {
  expense: Expense;
  currentUserId: string;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

export const ExpenseRow: React.FC<ExpenseRowProps> = ({
  expense,
  currentUserId,
  onDelete,
  canDelete = false,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const isPayer = expense.paidById === currentUserId;
  const userSplit = expense.splits.find((s) => s.userId === currentUserId);
  const userOwed = userSplit ? userSplit.amountOwed : 0;

  // Compute what current user lent or borrowed
  let balanceSnippet: React.ReactNode = null;
  if (isPayer) {
    const lent = expense.amount - userOwed;
    balanceSnippet = (
      <span className="text-[11px] font-semibold text-signal-green">
        you lent ₹{lent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </span>
    );
  } else if (userOwed > 0) {
    balanceSnippet = (
      <span className="text-[11px] font-semibold text-signal-red">
        you borrowed ₹{userOwed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </span>
    );
  } else {
    balanceSnippet = (
      <span className="text-[11px] text-secondaryText">not involved</span>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete expense "${expense.description}"?`)) return;
    try {
      setIsDeleting(true);
      await onDelete?.(expense.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="py-3.5 px-4 flex items-center justify-between gap-3 hover:bg-neutral-50/60 dark:hover:bg-neutral-900/30 transition-colors group">
      <div className="flex items-center gap-3.5 min-w-0">
        <CategoryIcon category={expense.category} size="md" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
              {expense.description}
            </h4>
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-medium flex-shrink-0">
              {expense.splitType}
            </span>
          </div>

          <p className="text-xs text-secondaryText truncate mt-0.5">
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              {isPayer ? 'You' : expense.paidBy.name}
            </span>{' '}
            paid ₹{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} •{' '}
            {formatDate(expense.date)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right">
          <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 block tracking-tight">
            ₹{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          {balanceSnippet}
        </div>

        {canDelete && onDelete && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-neutral-400 hover:text-signal-red hover:bg-red-50 dark:hover:bg-red-950/40 transition-all"
            title="Delete expense"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
