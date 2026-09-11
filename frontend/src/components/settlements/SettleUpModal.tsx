import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { api } from '../../api/client';
import { User, SimplifiedDebt } from '../../types';
import { ArrowRight } from 'lucide-react';

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  members: User[];
  prefilledDebt?: SimplifiedDebt | null;
  currentUserId: string;
  onSettled: () => void;
}

export const SettleUpModal: React.FC<SettleUpModalProps> = ({
  isOpen,
  onClose,
  groupId,
  members,
  prefilledDebt,
  currentUserId,
  onSettled,
}) => {
  const [fromUserId, setFromUserId] = useState<string>(currentUserId);
  const [toUserId, setToUserId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prefilledDebt) {
      setFromUserId(prefilledDebt.fromUserId);
      setToUserId(prefilledDebt.toUserId);
      setAmount(prefilledDebt.amount.toString());
      setNotes('Settled via SplitEase');
    } else {
      setFromUserId(currentUserId);
      const otherMember = members.find((m) => m.id !== currentUserId);
      setToUserId(otherMember ? otherMember.id : '');
      setAmount('');
      setNotes('');
    }
    setError(null);
  }, [isOpen, prefilledDebt, currentUserId, members]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }
    if (fromUserId === toUserId) {
      setError('Sender and receiver cannot be the same person');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await api.post(`/groups/${groupId}/settlements`, {
        fromUserId,
        toUserId,
        amount: numAmount,
        notes: notes.trim() || undefined,
      });

      onSettled();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record settlement');
    } finally {
      setIsLoading(false);
    }
  };

  const sender = members.find((m) => m.id === fromUserId);
  const receiver = members.find((m) => m.id === toUserId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settle Up Debt"
      description="Record a direct payment between group members to clear or reduce balances"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-signal-red-subtle text-signal-red text-xs">
            {error}
          </div>
        )}

        {/* Visual transfer preview */}
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-border-light/60 dark:border-border-dark/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar name={sender?.name || 'Sender'} src={sender?.avatarUrl} size="sm" />
            <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              {fromUserId === currentUserId ? 'You' : sender?.name}
            </span>
          </div>

          <div className="flex items-center gap-1 text-secondaryText">
            <span className="text-xs">pays</span>
            <ArrowRight className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-2">
            <Avatar name={receiver?.name || 'Receiver'} src={receiver?.avatarUrl} size="sm" />
            <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              {toUserId === currentUserId ? 'You' : receiver?.name}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
              Payer (Who paid)
            </label>
            <select
              value={fromUserId}
              onChange={(e) => setFromUserId(e.target.value)}
              className="w-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id === currentUserId ? 'You' : m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
              Receiver (Who received)
            </label>
            <select
              value={toUserId}
              onChange={(e) => setToUserId(e.target.value)}
              className="w-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id === currentUserId ? 'You' : m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

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

        <Input
          label="Payment Note (Optional)"
          placeholder="e.g. UPI transfer, Cash, Google Pay"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Record Settlement
          </Button>
        </div>
      </form>
    </Modal>
  );
};
