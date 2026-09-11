import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { User } from '../../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      const updated = await api.patch<User>('/users/profile', {
        name: name.trim(),
        avatarUrl: avatarUrl.trim() || null,
      });
      setUser(updated);
      setSuccess('Profile updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      await api.post('/users/change-password', {
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setSuccess('Password changed successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Account Settings"
      description="Manage your profile information and security"
    >
      <div className="space-y-5">
        {/* Tab switcher */}
        <div className="flex border-b border-border-light dark:border-border-dark">
          <button
            onClick={() => {
              setActiveTab('profile');
              setError(null);
              setSuccess(null);
            }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
                : 'border-transparent text-secondaryText hover:text-neutral-900'
            }`}
          >
            General Profile
          </button>
          <button
            onClick={() => {
              setActiveTab('security');
              setError(null);
              setSuccess(null);
            }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'security'
                ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
                : 'border-transparent text-secondaryText hover:text-neutral-900'
            }`}
          >
            Security & Password
          </button>
        </div>

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

        {activeTab === 'profile' ? (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar name={name || user.name} src={avatarUrl} size="lg" />
              <div>
                <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
                  Profile Avatar
                </p>
                <p className="text-[11px] text-secondaryText">
                  Pick a preset below or enter an image URL
                </p>
              </div>
            </div>

            {/* Presets */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                Preset Avatars
              </label>
              <div className="flex gap-2">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(preset)}
                    className={`rounded-full p-0.5 border-2 transition-all ${
                      avatarUrl === preset
                        ? 'border-neutral-900 dark:border-neutral-100 scale-105'
                        : 'border-transparent hover:opacity-80'
                    }`}
                  >
                    <img
                      src={preset}
                      alt="Preset"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Avatar URL"
              placeholder="https://example.com/avatar.jpg"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />

            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Email Address"
              value={user.email}
              disabled
              helperText="Email cannot be changed"
            />

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="primary" isLoading={isLoading}>
                Save Profile
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />

            <Input
              label="New Password"
              type="password"
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="primary" isLoading={isLoading}>
                Update Password
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
