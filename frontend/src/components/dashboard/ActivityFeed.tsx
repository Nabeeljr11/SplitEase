import React from 'react';
import { ActivityItem } from '../../types';
import { CategoryIcon } from '../common/CategoryIcon';
import { Avatar } from '../common/Avatar';
import { ArrowRight, Clock } from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivityItem[];
  onSelectGroup?: (groupId: string) => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, onSelectGroup }) => {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-6 transition-all duration-150">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Recent Activity
          </h3>
          <p className="text-xs text-secondaryText mt-0.5">Across all your groups</p>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-border-light dark:border-border-dark rounded-2xl">
          <Clock className="w-8 h-8 mx-auto text-neutral-300 dark:text-neutral-600 mb-2 stroke-[1.5]" />
          <p className="text-xs text-secondaryText">No recent activity found</p>
        </div>
      ) : (
        <div className="divide-y divide-border-light/60 dark:divide-border-dark/60">
          {activities.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              onClick={() => onSelectGroup?.(item.group.id)}
              className="py-3.5 flex items-center justify-between gap-3 group cursor-pointer hover:bg-neutral-50/70 dark:hover:bg-neutral-900/30 -mx-3 px-3 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <CategoryIcon category={item.category} size="md" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {item.description}
                    </p>
                    <span className="text-[11px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex-shrink-0">
                      {item.group.iconEmoji} {item.group.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-secondaryText truncate mt-0.5">
                    {item.subtitle} • {formatDate(item.date)}
                  </p>
                </div>
              </div>

              <div className="text-right flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
