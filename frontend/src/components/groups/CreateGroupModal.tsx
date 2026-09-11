import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { api } from '../../api/client';
import { Group } from '../../types';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (group: Group) => void;
}

const EMOJI_OPTIONS = ['🏖️', '🏠', '🍕', '✈️', '🎒', '☕', '🎮', '💰', '⛺', '🚗', '🎉', '💻'];

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onGroupCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconEmoji, setIconEmoji] = useState('🏖️');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const newGroup = await api.post<Group>('/groups', {
        name: name.trim(),
        description: description.trim() || undefined,
        iconEmoji,
      });
      setName('');
      setDescription('');
      onGroupCreated(newGroup);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Group"
      description="Start tracking expenses with friends, flatmates, or travel groups"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-signal-red-subtle text-signal-red text-xs">
            {error}
          </div>
        )}

        {/* Emoji picker */}
        <div>
          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
            Choose an Icon
          </label>
          <div className="flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setIconEmoji(emoji)}
                className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border transition-all ${
                  iconEmoji === emoji
                    ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-800 scale-110 shadow-sm'
                    : 'border-border-light dark:border-border-dark hover:bg-neutral-50 dark:hover:bg-neutral-900'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Group Name"
          placeholder="e.g. Goa Trip 2026, Flat 402, Hackathon Team"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          label="Description (Optional)"
          placeholder="e.g. Shared expenses for our weekend getaway"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Create Group
          </Button>
        </div>
      </form>
    </Modal>
  );
};
