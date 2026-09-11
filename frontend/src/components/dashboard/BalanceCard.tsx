import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Plus, Users, UserPlus } from 'lucide-react';
import { Button } from '../common/Button';

interface BalanceCardProps {
  totalNet: number;
  totalOwedToUser: number;
  totalUserOwes: number;
  onAddExpense: () => void;
  onCreateGroup: () => void;
  onJoinGroup: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  totalNet,
  totalOwedToUser,
  totalUserOwes,
  onAddExpense,
  onCreateGroup,
  onJoinGroup,
}) => {
  const isPositive = totalNet > 0.01;
  const isNegative = totalNet < -0.01;
  const isSettled = !isPositive && !isNegative;

  return (
    <div className="w-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-6 sm:p-8 shadow-sm transition-all duration-150">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-secondaryText">
              Total Net Balance
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                isPositive
                  ? 'bg-signal-green-subtle text-signal-green'
                  : isNegative
                  ? 'bg-signal-red-subtle text-signal-red'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {isPositive
                ? 'You are owed'
                : isNegative
                ? 'You owe'
                : 'All Settled'}
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <h1
              className={`text-4xl sm:text-5xl font-extrabold tracking-tighter ${
                isPositive
                  ? 'text-signal-green'
                  : isNegative
                  ? 'text-signal-red'
                  : 'text-neutral-900 dark:text-neutral-100'
              }`}
            >
              {isPositive ? '+' : isNegative ? '-' : ''}₹
              {Math.abs(totalNet).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h1>
          </div>

          <p className="text-xs text-secondaryText mt-1.5">
            {isSettled
              ? 'You do not owe anything and no one owes you.'
              : isPositive
              ? `You are in positive balance across all your groups.`
              : `You have pending payments to settle across your groups.`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="primary"
            size="md"
            onClick={onAddExpense}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Expense
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={onCreateGroup}
            leftIcon={<Users className="w-4 h-4" />}
          >
            New Group
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={onJoinGroup}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Join Code
          </Button>
        </div>
      </div>

      {/* Sub metrics divider */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-6 border-t border-border-light dark:border-border-dark">
        <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-border-light/60 dark:border-border-dark/60">
          <div className="w-10 h-10 rounded-xl bg-signal-green-subtle flex items-center justify-center text-signal-green flex-shrink-0">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-secondaryText block">
              Total owed to you
            </span>
            <span className="text-lg font-bold text-signal-green tracking-tight">
              +₹
              {totalOwedToUser.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-border-light/60 dark:border-border-dark/60">
          <div className="w-10 h-10 rounded-xl bg-signal-red-subtle flex items-center justify-center text-signal-red flex-shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-secondaryText block">
              Total you owe
            </span>
            <span className="text-lg font-bold text-signal-red tracking-tight">
              -₹
              {totalUserOwes.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
