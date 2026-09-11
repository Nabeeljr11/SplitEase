import React, { useState, useEffect, useCallback } from 'react';
import { Group } from '../types';
import { api } from '../api/client';
import { GroupCard } from '../components/groups/GroupCard';
import { CreateGroupModal } from '../components/groups/CreateGroupModal';
import { JoinGroupModal } from '../components/groups/JoinGroupModal';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Plus, UserPlus, Search, Users } from 'lucide-react';

interface GroupsPageProps {
  onSelectGroup: (groupId: string) => void;
}

export const GroupsPage: React.FC<GroupsPageProps> = ({ onSelectGroup }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  const loadGroups = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get<Group[]>('/groups');
      setGroups(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    (g.description && g.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Groups
          </h1>
          <p className="text-xs text-secondaryText mt-0.5">
            Manage your shared expenses, flatmates, and vacation budgets
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsJoinOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Join Code
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Group
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <Input
          placeholder="Search groups by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-7 h-7 mx-auto border-2 border-neutral-900 dark:border-neutral-100 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-secondaryText">Loading groups...</p>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="p-12 text-center bg-surface-light dark:bg-surface-dark border border-dashed border-border-light dark:border-border-dark rounded-3xl">
          <Users className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600 mb-3 stroke-[1.5]" />
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            {search ? 'No groups match your search' : 'No groups yet'}
          </h3>
          <p className="text-xs text-secondaryText mt-1 mb-4">
            {search ? 'Try a different search term' : 'Create a group or join one with an invite code.'}
          </p>
          {!search && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Group
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((g) => (
            <GroupCard key={g.id} group={g} onClick={() => onSelectGroup(g.id)} />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateGroupModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onGroupCreated={(newGroup) => {
          loadGroups();
          onSelectGroup(newGroup.id);
        }}
      />

      <JoinGroupModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onJoined={loadGroups}
      />
    </div>
  );
};
