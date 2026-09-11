import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Dashboard } from './pages/Dashboard';
import { GroupsPage } from './pages/GroupsPage';
import { GroupDetailView } from './components/groups/GroupDetailView';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { AddExpenseModal } from './components/expenses/AddExpenseModal';
import { ProfileModal } from './components/profile/ProfileModal';
import { Group } from './types';
import { api } from './api/client';

export function App() {
  const { user, isLoading } = useAuth();

  // Navigation & View state
  const [authView, setAuthView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [currentView, setCurrentView] = useState<'dashboard' | 'groups'>('dashboard');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Global modals
  const [isGlobalAddExpenseOpen, setIsGlobalAddExpenseOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userGroups, setUserGroups] = useState<Group[]>([]);

  // Load user groups for global add-expense modal
  useEffect(() => {
    if (user) {
      api.get<Group[]>('/groups').then(setUserGroups).catch(console.error);

      // Check URL for invite code
      const urlParams = new URLSearchParams(window.location.search);
      const inviteCode = urlParams.get('invite');
      if (inviteCode) {
        api.post('/groups/join', { inviteCode })
          .then((res: any) => {
            if (res.group) {
              setSelectedGroupId(res.group.id);
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          })
          .catch(console.error);
      }
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-neutral-900 text-xl font-bold animate-pulse">
            ⚡
          </div>
          <p className="text-xs font-medium text-secondaryText">Loading SplitEase...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated flow
  if (!user) {
    if (authView === 'signup') {
      return <Signup onNavigateLogin={() => setAuthView('login')} />;
    }
    if (authView === 'forgot') {
      return <ForgotPassword onNavigateLogin={() => setAuthView('login')} />;
    }
    return (
      <Login
        onNavigateSignup={() => setAuthView('signup')}
        onNavigateForgot={() => setAuthView('forgot')}
      />
    );
  }

  // Authenticated App Shell
  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark text-primaryText-light dark:text-primaryText-dark transition-colors duration-150">
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          setSelectedGroupId(null);
          setCurrentView(view);
        }}
        onAddExpenseClick={() => setIsGlobalAddExpenseOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {selectedGroupId ? (
          <GroupDetailView
            groupId={selectedGroupId}
            onBack={() => setSelectedGroupId(null)}
            onGroupDeleted={() => {
              setSelectedGroupId(null);
              setCurrentView('groups');
            }}
          />
        ) : currentView === 'dashboard' ? (
          <Dashboard
            onSelectGroup={(gid) => setSelectedGroupId(gid)}
            onNavigateGroups={() => setCurrentView('groups')}
          />
        ) : (
          <GroupsPage onSelectGroup={(gid) => setSelectedGroupId(gid)} />
        )}
      </main>

      {/* Global Modals */}
      <AddExpenseModal
        isOpen={isGlobalAddExpenseOpen}
        onClose={() => setIsGlobalAddExpenseOpen(false)}
        groups={userGroups}
        currentUser={user}
        onExpenseAdded={() => {
          // Re-fetch groups and refresh
          api.get<Group[]>('/groups').then(setUserGroups).catch(console.error);
        }}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}
