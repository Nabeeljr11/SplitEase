import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { api } from '../../api/client';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoined: () => void;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({
  isOpen,
  onClose,
  onJoined,
}) => {
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      // If full URL was pasted, extract the code
      let code = inviteCode.trim();
      if (code.includes('invite=')) {
        code = code.split('invite=')[1].split('&')[0];
      } else if (code.includes('/join/')) {
        code = code.split('/join/')[1].split('?')[0];
      }

      await api.post('/groups/join', { inviteCode: code });
      setInviteCode('');
      onJoined();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid invite code or already a member');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Join a Group"
      description="Enter the group invite code or link provided by the group admin"
    >
      <form onSubmit={handleJoin} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-signal-red-subtle text-signal-red text-xs">
            {error}
          </div>
        )}

        <Input
          label="Invite Code or Link"
          placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          required
        />

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Join Group
          </Button>
        </div>
      </form>
    </Modal>
  );
};
