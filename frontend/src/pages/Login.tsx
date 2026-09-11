import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { Mail, Lock, Sparkles } from 'lucide-react';

interface LoginProps {
  onNavigateSignup: () => void;
  onNavigateForgot: () => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigateSignup, onNavigateForgot }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 relative bg-background-light dark:bg-background-dark">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Header Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-neutral-900 dark:bg-neutral-100 items-center justify-center text-white dark:text-neutral-900 text-2xl font-bold shadow-sm mb-2">
            ⚡
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
            Welcome to SplitEase
          </h1>
          <p className="text-xs sm:text-sm text-secondaryText">
            Split group bills and simplify balances with minimum transactions
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-signal-red-subtle text-signal-red text-xs">
                {error}
              </div>
            )}

            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={onNavigateForgot}
                className="text-xs text-secondaryText hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Logins for Interview / Review */}
          <div className="mt-6 pt-5 border-t border-border-light dark:border-border-dark">
            <div className="flex items-center gap-1.5 mb-2.5 text-secondaryText">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Quick Demo Accounts (password: password123)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('alex@example.com')}
                className="px-2.5 py-1.5 text-left rounded-xl border border-border-light dark:border-border-dark hover:bg-neutral-50 dark:hover:bg-neutral-900 text-xs transition-colors"
              >
                <span className="font-semibold text-neutral-900 dark:text-neutral-100 block truncate">
                  Alex Johnson
                </span>
                <span className="text-[10px] text-secondaryText truncate block">
                  alex@example.com
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('maya@example.com')}
                className="px-2.5 py-1.5 text-left rounded-xl border border-border-light dark:border-border-dark hover:bg-neutral-50 dark:hover:bg-neutral-900 text-xs transition-colors"
              >
                <span className="font-semibold text-neutral-900 dark:text-neutral-100 block truncate">
                  Maya Patel
                </span>
                <span className="text-[10px] text-secondaryText truncate block">
                  maya@example.com
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer switch */}
        <p className="text-center text-xs text-secondaryText">
          Don't have an account?{' '}
          <button
            onClick={onNavigateSignup}
            className="font-semibold text-neutral-900 dark:text-neutral-100 hover:underline"
          >
            Create one
          </button>
        </p>
      </div>
    </div>
  );
};
