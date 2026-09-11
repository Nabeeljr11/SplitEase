import React from 'react';
import { Group } from '../../types';
import { Avatar } from '../common/Avatar';
import { ChevronRight } from 'lucide-react';

interface GroupCardProps {
  group: Group;
  onClick: () => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group, onClick }) => {
  const isPositive = group.userNetBalance > 0.01;
  const isNegative = group.userNetBalance < -0.01;

  // Show up to 3 overlapping avatars
  const visibleMembers = group.members.slice(0, 3);
  const remainingCount = group.memberCount - visibleMembers.length;

  return (
    <div
      onClick={onClick}
      className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-5 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all duration-150 cursor-pointer shadow-sm hover:shadow-md btn-press flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-2xl border border-border-light dark:border-border-dark flex-shrink-0">
              {group.iconEmoji || '💰'}
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight line-clamp-1">
                {group.name}
              </h3>
              {group.description && (
                <p className="text-xs text-secondaryText line-clamp-1 mt-0.5">
                  {group.description}
                </p>
              )}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-1" />
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-border-light/60 dark:border-border-dark/60 flex items-center justify-between">
        {/* Overlapping member avatars */}
        <div className="flex items-center -space-x-2 overflow-hidden">
          {visibleMembers.map((m) => (
            <Avatar
              key={m.id}
              name={m.name}
              src={m.avatarUrl}
              size="sm"
              className="ring-2 ring-surface-light dark:ring-surface-dark"
            />
          ))}
          {remainingCount > 0 && (
            <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 ring-2 ring-surface-light dark:ring-surface-dark flex items-center justify-center text-[10px] font-semibold text-secondaryText">
              +{remainingCount}
            </div>
          )}
        </div>

        {/* Net balance for user */}
        <div className="text-right">
          <span className="text-[10px] text-secondaryText block">Your balance</span>
          <span
            className={`text-sm font-bold tracking-tight ${
              isPositive
                ? 'text-signal-green'
                : isNegative
                ? 'text-signal-red'
                : 'text-neutral-500'
            }`}
          >
            {isPositive ? '+' : isNegative ? '-' : ''}₹
            {Math.abs(group.userNetBalance).toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>
    </div>
  );
};
