import React, { useState } from 'react';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { api } from '../api/client';
import { Mail, KeyRound, ArrowLeft } from 'lucide-react';

interface ForgotPasswordProps {
  onNavigateLogin: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigateLogin }) => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.post<{ message: string; resetToken?: string }>('/auth/forgot-password', {
        email: email.trim(),
      });
      setSuccess('Reset token generated! For local development, it is pre-filled below.');
      if (res.resetToken) {
        setToken(res.resetToken);
      }
      setStep('reset');
    } catch (err: any) {
      setError(err.message || 'Failed to request reset token');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      await api.post('/auth/reset-password', {
        token: token.trim(),
        newPassword,
      });
      setSuccess('Password reset successfully! You can now log in.');
      setTimeout(() => {
        onNavigateLogin();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 relative bg-background-light dark:bg-background-dark">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-neutral-900 dark:bg-neutral-100 items-center justify-center text-white dark:text-neutral-900 text-2xl font-bold shadow-sm mb-2">
            ⚡
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
            Reset Password
          </h1>
          <p className="text-xs sm:text-sm text-secondaryText">
            {step === 'request'
              ? 'Enter your email to receive a password reset link'
              : 'Enter your reset token and your new password'}
          </p>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-6 sm:p-8 shadow-sm">
          {error && (
            <div className="p-3 rounded-xl bg-signal-red-subtle text-signal-red text-xs mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-xl bg-signal-green-subtle text-signal-green text-xs mb-4">
              {success}
            </div>
          )}

          {step === 'request' ? (
            <form onSubmit={handleRequestToken} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isLoading}
              >
                Send Reset Link
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <Input
                label="Reset Token"
                placeholder="Paste token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                leftIcon={<KeyRound className="w-4 h-4" />}
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

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isLoading}
              >
                Update Password
              </Button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-border-light dark:border-border-dark text-center">
            <button
              onClick={onNavigateLogin}
              className="inline-flex items-center gap-1.5 text-xs text-secondaryText hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
