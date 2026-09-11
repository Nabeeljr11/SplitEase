import React, { useState, useEffect, useCallback } from 'react';
import { GroupDetail, GroupBalanceResponse, Expense, Settlement, SimplifiedDebt, ExpenseCategory } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { ExpenseRow } from '../expenses/ExpenseRow';
import { AddExpenseModal } from '../expenses/AddExpenseModal';
import { SettleUpModal } from '../settlements/SettleUpModal';
import { InviteModal } from './InviteModal';
import {
  ArrowLeft,
  Plus,
  ArrowRightLeft,
  UserPlus,
  Settings,
  Sparkles,
  Receipt,
  History,
  Trash2,
  LogOut,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface GroupDetailViewProps {
  groupId: string;
  onBack: () => void;
  onGroupDeleted: () => void;
}

const CATEGORY_FILTERS: { id: string; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'FOOD', label: 'Food' },
  { id: 'TRAVEL', label: 'Travel' },
  { id: 'RENT', label: 'Rent' },
  { id: 'UTILITIES', label: 'Utilities' },
  { id: 'ENTERTAINMENT', label: 'Fun' },
  { id: 'OTHER', label: 'Other' },
];

export const GroupDetailView: React.FC<GroupDetailViewProps> = ({
  groupId,
  onBack,
  onGroupDeleted,
}) => {
  const { user } = useAuth();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [balances, setBalances] = useState<GroupBalanceResponse | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [activeTab, setActiveTab] = useState<'expenses' | 'settlements' | 'balances'>('expenses');

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedMember, setSelectedMember] = useState('ALL');

  // Modal states
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
  const [prefilledDebt, setPrefilledDebt] = useState<SimplifiedDebt | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGroupData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [groupRes, balancesRes, expensesRes, settlementsRes] = await Promise.all([
        api.get<GroupDetail>(`/groups/${groupId}`),
        api.get<GroupBalanceResponse>(`/groups/${groupId}/balances`),
        api.get<{ expenses: Expense[] }>(`/groups/${groupId}/expenses`),
        api.get<Settlement[]>(`/groups/${groupId}/settlements`),
      ]);

      setGroup(groupRes);
      setBalances(balancesRes);
      setExpenses(expensesRes.expenses || []);
      setSettlements(settlementsRes || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load group details');
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadGroupData();
  }, [loadGroupData]);

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await api.delete(`/expenses/${expenseId}`);
      loadGroupData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense');
    }
  };

  const handleDeleteSettlement = async (settlementId: string) => {
    if (!window.confirm('Delete this settlement record?')) return;
    try {
      await api.delete(`/settlements/${settlementId}`);
      loadGroupData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete settlement');
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    try {
      await api.post(`/groups/${groupId}/leave`);
      onGroupDeleted();
    } catch (err: any) {
      alert(err.message || 'Failed to leave group');
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this group? All expenses will be lost.')) return;
    try {
      await api.delete(`/groups/${groupId}`);
      onGroupDeleted();
    } catch (err: any) {
      alert(err.message || 'Failed to delete group');
    }
  };

  if (isLoading && !group) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 mx-auto border-2 border-neutral-900 dark:border-neutral-100 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-secondaryText">Loading group details...</p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="py-16 text-center max-w-md mx-auto">
        <p className="text-sm text-signal-red mb-4">{error || 'Group not found'}</p>
        <Button variant="secondary" onClick={onBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Groups
        </Button>
      </div>
    );
  }

  const userBalance = balances?.currentUser.netBalance || 0;
  const isPositive = userBalance > 0.01;
  const isNegative = userBalance < -0.01;

  // Filtered expenses
  const filteredExpenses = expenses.filter((exp) => {
    if (selectedCategory !== 'ALL' && exp.category !== selectedCategory) return false;
    if (selectedMember !== 'ALL') {
      const isPayer = exp.paidById === selectedMember;
      const isSplitter = exp.splits.some((s) => s.userId === selectedMember);
      if (!isPayer && !isSplitter) return false;
    }
    return true;
  });

  const memberUsers = group.members.map((m) => m.user);

  return (
    <div className="space-y-6 pb-16">
      {/* Top navigation & action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-transparent hover:border-border-light dark:hover:border-border-dark btn-press transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-border-light dark:border-border-dark flex-shrink-0">
              {group.iconEmoji}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                  {group.name}
                </h1>
                {group.currentUserRole === 'ADMIN' && (
                  <Badge variant="neutral" size="sm">Admin</Badge>
                )}
              </div>
              {group.description && (
                <p className="text-xs text-secondaryText mt-0.5">{group.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Header quick actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsInviteOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Invite
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setPrefilledDebt(null);
              setIsSettleUpOpen(true);
            }}
            leftIcon={<ArrowRightLeft className="w-4 h-4" />}
          >
            Settle Up
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddExpenseOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Expense
          </Button>

          {/* Group settings button */}
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-border-light dark:border-border-dark btn-press transition-colors relative"
            title="Group settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Dropdown / Panel if toggled */}
      {isSettingsOpen && (
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-border-light dark:border-border-dark flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="text-xs text-secondaryText">
            <span>Invite code: </span>
            <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">{group.inviteCode}</span>
            <span className="mx-2">•</span>
            <span>Created by {group.createdBy.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLeaveGroup}
              leftIcon={<LogOut className="w-3.5 h-3.5 text-neutral-500" />}
            >
              Leave Group
            </Button>
            {group.currentUserRole === 'ADMIN' && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteGroup}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete Group
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Balance Hero banner for this group */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-secondaryText block mb-1">
              Your Net Position
            </span>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-3xl sm:text-4xl font-extrabold tracking-tighter ${
                  isPositive
                    ? 'text-signal-green'
                    : isNegative
                    ? 'text-signal-red'
                    : 'text-neutral-900 dark:text-neutral-100'
                }`}
              >
                {isPositive ? '+' : isNegative ? '-' : ''}₹
                {Math.abs(userBalance).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-xs text-secondaryText">
                {isPositive ? 'owed to you' : isNegative ? 'you owe' : 'all settled'}
              </span>
            </div>
          </div>

          {/* Member balance avatars row */}
          <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
            {balances?.memberSummaries.map((m) => {
              const mPos = m.netBalance > 0.01;
              const mNeg = m.netBalance < -0.01;
              return (
                <div
                  key={m.userId}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-neutral-50 dark:bg-neutral-900 border border-border-light dark:border-border-dark"
                >
                  <Avatar name={m.name} src={m.avatarUrl} size="xs" />
                  <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                    {m.userId === user?.id ? 'You' : m.name.split(' ')[0]}
                  </span>
                  <span
                    className={`text-[11px] font-bold ${
                      mPos
                        ? 'text-signal-green'
                        : mNeg
                        ? 'text-signal-red'
                        : 'text-neutral-400'
                    }`}
                  >
                    {mPos ? '+' : ''}₹{m.netBalance.toFixed(0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Suggested Settlements Section (Min Cash Flow Algorithm Output) */}
      {balances && balances.simplifiedDebts.length > 0 && (
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
                Suggested Settlements (Min. Transactions)
              </h3>
            </div>
            <span className="text-[11px] text-secondaryText hidden sm:inline">
              Greedy Cash Flow Algorithm
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {balances.simplifiedDebts.map((debt, index) => {
              const involvesUser = debt.fromUserId === user?.id || debt.toUserId === user?.id;
              const userIsPayer = debt.fromUserId === user?.id;

              return (
                <div
                  key={index}
                  className={`p-4 rounded-2xl border transition-all ${
                    involvesUser
                      ? 'border-neutral-400 dark:border-neutral-600 bg-neutral-50/50 dark:bg-neutral-900/40'
                      : 'border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={debt.fromUserName} src={debt.fromUserAvatar} size="xs" />
                      <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {debt.fromUserId === user?.id ? 'You' : debt.fromUserName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-secondaryText flex-shrink-0 px-2">
                      <span>pays</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>

                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={debt.toUserName} src={debt.toUserAvatar} size="xs" />
                      <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {debt.toUserId === user?.id ? 'You' : debt.toUserName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border-light/60 dark:border-border-dark/60">
                    <span className="text-base font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
                      ₹{debt.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>

                    {involvesUser && (
                      <Button
                        size="sm"
                        variant={userIsPayer ? 'primary' : 'secondary'}
                        onClick={() => {
                          setPrefilledDebt(debt);
                          setIsSettleUpOpen(true);
                        }}
                      >
                        {userIsPayer ? 'Pay Now' : 'Mark Received'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Tabs (Expenses, Settlements History, Full Balances) */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl overflow-hidden shadow-sm">
        <div className="flex border-b border-border-light dark:border-border-dark px-6 pt-4 gap-6">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`pb-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'expenses'
                ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
                : 'border-transparent text-secondaryText hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Expenses ({expenses.length})
          </button>

          <button
            onClick={() => setActiveTab('settlements')}
            className={`pb-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'settlements'
                ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
                : 'border-transparent text-secondaryText hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <History className="w-4 h-4" />
            Settlements ({settlements.length})
          </button>
        </div>

        {/* Tab 1: Expenses */}
        {activeTab === 'expenses' && (
          <div>
            {/* Category Filter Chips & Member filter */}
            <div className="p-4 border-b border-border-light/60 dark:border-border-dark/60 flex flex-wrap items-center justify-between gap-3 bg-neutral-50/50 dark:bg-neutral-900/20">
              <div className="flex flex-wrap items-center gap-1.5">
                {CATEGORY_FILTERS.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm'
                        : 'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-neutral-600 dark:text-neutral-400 hover:border-neutral-400'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Member filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-neutral-400" />
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl px-2.5 py-1 text-xs text-neutral-800 dark:text-neutral-200"
                >
                  <option value="ALL">All Members</option>
                  {memberUsers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Expense rows list */}
            {filteredExpenses.length === 0 ? (
              <div className="py-16 text-center">
                <Receipt className="w-8 h-8 mx-auto text-neutral-300 dark:text-neutral-600 mb-2 stroke-[1.5]" />
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  No expenses found
                </p>
                <p className="text-xs text-secondaryText mt-1 mb-4">
                  {expenses.length === 0
                    ? 'Start by recording the first expense in this group.'
                    : 'Try changing your category or member filter.'}
                </p>
                {expenses.length === 0 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsAddExpenseOpen(true)}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Add Expense
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border-light/60 dark:divide-border-dark/60">
                {filteredExpenses.map((exp) => (
                  <ExpenseRow
                    key={exp.id}
                    expense={exp}
                    currentUserId={user?.id || ''}
                    onDelete={handleDeleteExpense}
                    canDelete={
                      exp.paidById === user?.id ||
                      exp.createdById === user?.id ||
                      group.currentUserRole === 'ADMIN'
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Settlement History */}
        {activeTab === 'settlements' && (
          <div>
            {settlements.length === 0 ? (
              <div className="py-16 text-center">
                <History className="w-8 h-8 mx-auto text-neutral-300 dark:text-neutral-600 mb-2 stroke-[1.5]" />
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  No settlements recorded yet
                </p>
                <p className="text-xs text-secondaryText mt-1 mb-4">
                  When members settle debts, the records will appear here.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setPrefilledDebt(null);
                    setIsSettleUpOpen(true);
                  }}
                  leftIcon={<ArrowRightLeft className="w-4 h-4" />}
                >
                  Record Settlement
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border-light/60 dark:divide-border-dark/60">
                {settlements.map((st) => {
                  const canDelete =
                    st.fromUserId === user?.id ||
                    st.toUserId === user?.id ||
                    group.currentUserRole === 'ADMIN';

                  return (
                    <div
                      key={st.id}
                      className="p-4 flex items-center justify-between gap-3 hover:bg-neutral-50/60 dark:hover:bg-neutral-900/30 transition-colors group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-signal-green-subtle text-signal-green flex items-center justify-center flex-shrink-0">
                          <ArrowRightLeft className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                            <span className="font-bold">{st.fromUser.name}</span> paid{' '}
                            <span className="font-bold">{st.toUser.name}</span>
                          </p>
                          <p className="text-xs text-secondaryText mt-0.5">
                            {new Date(st.settledAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                            {st.notes && ` • ${st.notes}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-base font-bold text-signal-green tracking-tight">
                          ₹{st.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteSettlement(st.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-neutral-400 hover:text-signal-red hover:bg-red-50 dark:hover:bg-red-950/40 transition-all"
                            title="Delete settlement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {user && (
        <>
          <AddExpenseModal
            isOpen={isAddExpenseOpen}
            onClose={() => setIsAddExpenseOpen(false)}
            currentGroup={group}
            currentUser={user}
            onExpenseAdded={loadGroupData}
          />

          <SettleUpModal
            isOpen={isSettleUpOpen}
            onClose={() => setIsSettleUpOpen(false)}
            groupId={groupId}
            members={memberUsers}
            prefilledDebt={prefilledDebt}
            currentUserId={user.id}
            onSettled={loadGroupData}
          />

          <InviteModal
            isOpen={isInviteOpen}
            onClose={() => setIsInviteOpen(false)}
            groupId={groupId}
            groupName={group.name}
            inviteCode={group.inviteCode}
            onMemberInvited={loadGroupData}
          />
        </>
      )}
    </div>
  );
};
