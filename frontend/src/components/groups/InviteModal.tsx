import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { api } from '../../api/client';
import { Copy, Check, Mail } from 'lucide-react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  inviteCode: string;
  onMemberInvited: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  groupId,
  groupName,
  inviteCode,
  onMemberInvited,
}) => {
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const inviteLink = `${window.location.origin}/join?invite=${inviteCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInviteEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      await api.post(`/groups/${groupId}/invite`, { email: email.trim() });
      setSuccess(`Invitation sent to ${email}`);
      setEmail('');
      onMemberInvited();
    } catch (err: any) {
      setError(err.message || 'Failed to invite user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Invite to ${groupName}`}
      description="Share this link or enter their email address to add them directly"
    >
      <div className="space-y-6">
        {/* Shareable Link */}
        <div>
          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
            Shareable Invite Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="flex-1 bg-neutral-100 dark:bg-neutral-800/80 border border-border-light dark:border-border-dark rounded-xl px-3 py-2 text-xs text-neutral-600 dark:text-neutral-300 select-all font-mono"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={copyToClipboard}
              leftIcon={copied ? <Check className="w-3.5 h-3.5 text-signal-green" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <p className="text-[11px] text-secondaryText mt-1.5">
            Invite code: <span className="font-mono font-medium">{inviteCode}</span>
          </p>
        </div>

        <div className="relative flex items-center">
          <div className="flex-grow border-t border-border-light dark:border-border-dark" />
          <span className="flex-shrink mx-3 text-[11px] text-neutral-400 uppercase tracking-wider">
            or invite by email
          </span>
          <div className="flex-grow border-t border-border-light dark:border-border-dark" />
        </div>

        {/* Email invite form */}
        <form onSubmit={handleInviteEmail} className="space-y-3">
          {error && (
            <div className="p-3 rounded-xl bg-signal-red-subtle text-signal-red text-xs">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-xl bg-signal-green-subtle text-signal-green text-xs">
              {success}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Input
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              className="flex-1"
              required
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="whitespace-nowrap"
            >
              Add Member
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
