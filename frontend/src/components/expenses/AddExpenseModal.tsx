import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { SegmentedControl } from '../common/SegmentedControl';
import { CategoryIcon } from '../common/CategoryIcon';
import { Avatar } from '../common/Avatar';
import { Group, GroupDetail, User, ExpenseCategory, SplitType } from '../../types';
import { api } from '../../api/client';
import { Check } from 'lucide-react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGroup?: Group | GroupDetail | null;
  groups?: Group[];
  currentUser: User;
  onExpenseAdded: () => void;
}

const CATEGORIES: { id: ExpenseCategory; label: string }[] = [
  { id: 'FOOD', label: 'Food' },
  { id: 'TRAVEL', label: 'Travel' },
  { id: 'RENT', label: 'Rent' },
  { id: 'UTILITIES', label: 'Utilities' },
  { id: 'ENTERTAINMENT', label: 'Fun' },
  { id: 'OTHER', label: 'Other' },
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  currentGroup,
  groups = [],
  currentUser,
  onExpenseAdded,
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    currentGroup?.id || groups[0]?.id || ''
  );
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory>('FOOD');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paidById, setPaidById] = useState<string>(currentUser.id);
  const [splitType, setSplitType] = useState<SplitType>('EQUAL');

  // Member split configuration
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [splitValues, setSplitValues] = useState<Record<string, string>>({}); // for exact, percent, or shares

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When selectedGroupId changes, update member list
  useEffect(() => {
    if (!selectedGroupId) return;
    const g = groups.find((grp) => grp.id === selectedGroupId) || currentGroup;
        if (g && g.members) {
      // Ensure we have an array of User objects. The backend may return members as either User[] or GroupMember[] where each has a `user` field.
      const users: User[] = g.members.map((m: any) => {
        // If the member already looks like a User (has email), return it directly.
        if ((m as User).email) {
          return m as User;
        }
        // Otherwise, assume it's a GroupMember with a `user` property.
        return (m as any).user as User;
      });
      setGroupMembers(users);
      const allIds = new Set(users.map((u) => u.id));
      setSelectedMemberIds(allIds);

      // Default share counts or percentages
      const initialSplits: Record<string, string> = {};
      users.forEach((u) => {
        initialSplits[u.id] = splitType === 'SHARES' ? '1' : '';
      });
      setSplitValues(initialSplits);
    }
  }, [selectedGroupId, currentGroup, groups, splitType]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setDescription('');
      setAmount('');
      setError(null);
      setSplitType('EQUAL');
      setDate(new Date().toISOString().split('T')[0]);
      if (currentGroup) {
        setSelectedGroupId(currentGroup.id);
      }
    }
  }, [isOpen, currentGroup]);

  const numAmount = parseFloat(amount) || 0;
  const activeMembersCount = selectedMemberIds.size;

  const toggleMember = (memberId: string) => {
    const next = new Set(selectedMemberIds);
    if (next.has(memberId)) {
      if (next.size > 1) {
        next.delete(memberId);
      }
    } else {
      next.add(memberId);
    }
    setSelectedMemberIds(next);
  };

  const handleSplitValueChange = (memberId: string, val: string) => {
    setSplitValues((prev) => ({ ...prev, [memberId]: val }));
  };

  // Helper calculations for visual validation feedback
  const getValidationSummary = () => {
    if (numAmount <= 0) return null;

    if (splitType === 'EQUAL') {
      const perPerson = activeMembersCount > 0 ? numAmount / activeMembersCount : 0;
      return `₹${perPerson.toFixed(2)} per person`;
    }

    if (splitType === 'EXACT') {
      const sum = Array.from(selectedMemberIds).reduce(
        (acc, id) => acc + (parseFloat(splitValues[id] || '0') || 0),
        0
      );
      const diff = numAmount - sum;
      if (Math.abs(diff) < 0.01) {
        return <span className="text-signal-green font-medium">Exact sum matches! (₹{numAmount.toFixed(2)})</span>;
      }
      return (
        <span className="text-signal-red font-medium">
          {diff > 0 ? `₹${diff.toFixed(2)} left to allocate` : `₹${Math.abs(diff).toFixed(2)} over total`}
        </span>
      );
    }

    if (splitType === 'PERCENTAGE') {
      const sumPct = Array.from(selectedMemberIds).reduce(
        (acc, id) => acc + (parseFloat(splitValues[id] || '0') || 0),
        0
      );
      const diff = 100 - sumPct;
      if (Math.abs(diff) < 0.01) {
        return <span className="text-signal-green font-medium">Percentages sum to 100%!</span>;
      }
      return (
        <span className="text-signal-red font-medium">
          {diff > 0 ? `${diff.toFixed(1)}% remaining` : `${Math.abs(diff).toFixed(1)}% over 100%`}
        </span>
      );
    }

    if (splitType === 'SHARES') {
      const totalShares = Array.from(selectedMemberIds).reduce(
        (acc, id) => acc + (parseInt(splitValues[id] || '1', 10) || 1),
        0
      );
      return `${totalShares} total shares`;
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    if (numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (selectedMemberIds.size === 0) {
      setError('Select at least one member to split with');
      return;
    }

    // Build splits array
    const splitsPayload = Array.from(selectedMemberIds).map((userId) => {
      let val: number | undefined;
      if (splitType === 'EXACT') {
        val = parseFloat(splitValues[userId] || '0') || 0;
      } else if (splitType === 'PERCENTAGE') {
        val = parseFloat(splitValues[userId] || '0') || 0;
      } else if (splitType === 'SHARES') {
        val = parseInt(splitValues[userId] || '1', 10) || 1;
      }
      return { userId, value: val };
    });

    try {
      setIsLoading(true);
      setError(null);

      await api.post(`/groups/${selectedGroupId}/expenses`, {
        description: description.trim(),
        amount: numAmount,
        category,
        splitType,
        date: new Date(date).toISOString(),
        paidById,
        splits: splitsPayload,
      });

      onExpenseAdded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add expense');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Expense"
      description="Record a new shared expense and choose how it is divided"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-signal-red-subtle text-signal-red text-xs">
            {error}
          </div>
        )}

        {/* Group selector if multiple groups exist */}
        {groups.length > 1 && !currentGroup && (
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
              Select Group
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl px-3.5 py-2 text-sm text-neutral-900 dark:text-neutral-100"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.iconEmoji} {g.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Amount & Description */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="sm:col-span-2">
            <Input
              label="Description"
              placeholder="e.g. Dinner, Airbnb, Groceries"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              label="Amount (₹)"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              leftIcon={<span className="text-sm font-bold">₹</span>}
              required
            />
          </div>
        </div>

        {/* Category Pill Selection */}
        <div>
          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
            Category
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all btn-press ${
                  category === cat.id
                    ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-800 shadow-sm'
                    : 'border-border-light dark:border-border-dark hover:bg-neutral-50 dark:hover:bg-neutral-900/50'
                }`}
              >
                <CategoryIcon category={cat.id} size="sm" />
                <span className="text-[11px] font-medium text-neutral-800 dark:text-neutral-200">
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Payer and Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
              Paid by
            </label>
            <select
              value={paidById}
              onChange={(e) => setPaidById(e.target.value)}
              className="w-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl px-3.5 py-2 text-sm text-neutral-900 dark:text-neutral-100"
            >
              {groupMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id === currentUser.id ? 'You' : m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl px-3.5 py-2 text-sm text-neutral-900 dark:text-neutral-100"
            />
          </div>
        </div>

        {/* Split Type Segmented Control */}
        <div className="pt-2 border-t border-border-light dark:border-border-dark">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Split Method
            </span>
            <span className="text-xs">{getValidationSummary()}</span>
          </div>

          <SegmentedControl
            options={[
              { value: 'EQUAL', label: 'Equally' },
              { value: 'EXACT', label: 'Exact Amounts' },
              { value: 'PERCENTAGE', label: 'By %' },
              { value: 'SHARES', label: 'By Shares' },
            ]}
            value={splitType}
            onChange={(val) => setSplitType(val as SplitType)}
            className="w-full"
          />
        </div>

        {/* Member allocation list */}
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {groupMembers.map((m) => {
            const isSelected = selectedMemberIds.has(m.id);
            return (
              <div
                key={m.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                  isSelected
                    ? 'border-border-light dark:border-border-dark bg-neutral-50/70 dark:bg-neutral-900/30'
                    : 'border-transparent opacity-50'
                }`}
              >
                <div
                  onClick={() => toggleMember(m.id)}
                  className="flex items-center gap-2.5 cursor-pointer flex-1 select-none"
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                      isSelected
                        ? 'bg-neutral-900 dark:bg-neutral-100 border-neutral-900 dark:border-neutral-100 text-white dark:text-neutral-900'
                        : 'border-neutral-400'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <Avatar name={m.name} src={m.avatarUrl} size="xs" />
                  <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
                    {m.id === currentUser.id ? 'You' : m.name}
                  </span>
                </div>

                {/* Specific value inputs depending on split type */}
                {isSelected && (
                  <div className="w-28 flex-shrink-0">
                    {splitType === 'EQUAL' && (
                      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block text-right">
                        ₹
                        {(activeMembersCount > 0
                          ? numAmount / activeMembersCount
                          : 0
                        ).toFixed(2)}
                      </span>
                    )}

                    {splitType === 'EXACT' && (
                      <div className="relative flex items-center">
                        <span className="absolute left-2 text-xs text-neutral-400">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={splitValues[m.id] || ''}
                          onChange={(e) => handleSplitValueChange(m.id, e.target.value)}
                          className="w-full pl-5 pr-2 py-1 text-xs text-right bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-400"
                        />
                      </div>
                    )}

                    {splitType === 'PERCENTAGE' && (
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          step="0.1"
                          placeholder="0"
                          value={splitValues[m.id] || ''}
                          onChange={(e) => handleSplitValueChange(m.id, e.target.value)}
                          className="w-full pr-5 pl-2 py-1 text-xs text-right bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-400"
                        />
                        <span className="absolute right-2 text-xs text-neutral-400">%</span>
                      </div>
                    )}

                    {splitType === 'SHARES' && (
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={splitValues[m.id] || '1'}
                          onChange={(e) => handleSplitValueChange(m.id, e.target.value)}
                          className="w-full pr-7 pl-2 py-1 text-xs text-right bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-400"
                        />
                        <span className="absolute right-2 text-[10px] text-neutral-400">sh</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit action */}
        <div className="pt-2 flex items-center justify-end gap-2.5">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Save Expense
          </Button>
        </div>
      </form>
    </Modal>
  );
};
