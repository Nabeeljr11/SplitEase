import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { DashboardSummary, Group } from '../types';
import { BalanceCard } from '../components/dashboard/BalanceCard';
import { CategoryChart } from '../components/dashboard/CategoryChart';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { GroupCard } from '../components/groups/GroupCard';
import { AddExpenseModal } from '../components/expenses/AddExpenseModal';
import { CreateGroupModal } from '../components/groups/CreateGroupModal';
import { JoinGroupModal } from '../components/groups/JoinGroupModal';
import { Button } from '../components/common/Button';
import { Plus, Users, ArrowRight } from 'lucide-react';

interface DashboardProps {
  onSelectGroup: (groupId: string) => void;
  onNavigateGroups: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectGroup, onNavigateGroups }) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isJoinGroupOpen, setIsJoinGroupOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [sumRes, grpRes] = await Promise.all([
        api.get<DashboardSummary>('/dashboard/summary'),
        api.get<Group[]>('/groups'),
      ]);
      setSummary(sumRes);
      setGroups(grpRes || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading && !summary) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 mx-auto border-2 border-neutral-900 dark:border-neutral-100 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-secondaryText">Calculating net balances across your groups...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Balance Card */}
      <BalanceCard
        totalNet={summary?.totalNetBalance ?? 0}
        totalOwedToUser={summary?.totalOwedToUser ?? 0}
        totalUserOwes={summary?.totalUserOwes ?? 0}
        onAddExpense={() => setIsAddExpenseOpen(true)}
        onCreateGroup={() => setIsCreateGroupOpen(true)}
        onJoinGroup={() => setIsJoinGroupOpen(true)}
      />

      {/* Groups Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Your Groups
            </h2>
            <p className="text-xs text-secondaryText mt-0.5">
              Select a group to see expenses and minimum-transaction settlement plans
            </p>
          </div>
          {groups.length > 0 && (
            <button
              onClick={onNavigateGroups}
              className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 hover:underline flex items-center gap-1"
            >
              View all ({groups.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {groups.length === 0 ? (
          <div className="p-8 text-center bg-surface-light dark:bg-surface-dark border border-dashed border-border-light dark:border-border-dark rounded-3xl">
            <Users className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600 mb-3 stroke-[1.5]" />
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              No groups yet
            </h3>
            <p className="text-xs text-secondaryText mt-1 mb-4 max-w-sm mx-auto">
              Create a group for your flatmates, trip reunion, or colleagues to start splitting bills.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateGroupOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Group
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.slice(0, 6).map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onClick={() => onSelectGroup(group.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Analytics & Activity 2-column grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryChart data={summary?.categorySpending || []} />
        <ActivityFeed
          activities={summary?.activityFeed || []}
          onSelectGroup={(gid) => onSelectGroup(gid)}
        />
      </section>

      {/* Modals */}
      {user && (
        <>
          <AddExpenseModal
            isOpen={isAddExpenseOpen}
            onClose={() => setIsAddExpenseOpen(false)}
            groups={groups}
            currentUser={user}
            onExpenseAdded={loadData}
          />

          <CreateGroupModal
            isOpen={isCreateGroupOpen}
            onClose={() => setIsCreateGroupOpen(false)}
            onGroupCreated={(newGroup) => {
              loadData();
              onSelectGroup(newGroup.id);
            }}
          />

          <JoinGroupModal
            isOpen={isJoinGroupOpen}
            onClose={() => setIsJoinGroupOpen(false)}
            onJoined={loadData}
          />
        </>
      )}
    </div>
  );
};
