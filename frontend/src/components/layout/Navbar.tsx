import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { NotificationDropdown } from './NotificationDropdown';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { Plus, User, LogOut, Layers, ChevronDown } from 'lucide-react';

interface NavbarProps {
  onAddExpenseClick?: () => void;
  onOpenProfile?: () => void;
  currentView: 'dashboard' | 'groups';
  onNavigate: (view: 'dashboard' | 'groups') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onAddExpenseClick,
  onOpenProfile,
  currentView,
  onNavigate,
}) => {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-border-light dark:border-border-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-neutral-900 font-bold text-lg shadow-sm group-hover:scale-105 transition-transform duration-150">
              ⚡
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-neutral-900 dark:text-neutral-100">
                Split<span className="text-secondaryText font-normal">Ease</span>
              </span>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onNavigate('groups')}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                currentView === 'groups'
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              Groups
            </button>
          </nav>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2.5">
          {onAddExpenseClick && (
            <Button
              size="sm"
              variant="primary"
              onClick={onAddExpenseClick}
              leftIcon={<Plus className="w-4 h-4" />}
              className="hidden sm:inline-flex"
            >
              Add Expense
            </Button>
          )}

          <ThemeToggle />
          <NotificationDropdown />

          {/* User Profile Menu */}
          {user && (
            <div className="relative ml-1" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full border border-border-light dark:border-border-dark hover:border-neutral-300 dark:hover:border-neutral-700 bg-surface-light dark:bg-surface-dark btn-press transition-colors"
                aria-label="User menu"
              >
                <Avatar name={user.name} src={user.avatarUrl} size="sm" />
                <span className="hidden lg:inline text-xs font-medium text-neutral-800 dark:text-neutral-200 max-w-[100px] truncate">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 border-b border-border-light dark:border-border-dark">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-secondaryText truncate">{user.email}</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        onOpenProfile?.();
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2.5 transition-colors"
                    >
                      <User className="w-3.5 h-3.5" />
                      Profile & Settings
                    </button>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        onNavigate('groups');
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2.5 md:hidden transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      My Groups
                    </button>
                  </div>

                  <div className="border-t border-border-light dark:border-border-dark py-1">
                    <button
                      onClick={() => logout()}
                      className="w-full px-4 py-2 text-left text-xs font-medium text-signal-red hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2.5 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
