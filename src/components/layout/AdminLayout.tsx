import React, { Suspense } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  ChartBarIcon,
  UsersIcon,
  Cog6ToothIcon as SettingsIcon,
  ChatBubbleLeftRightIcon as FeedbackIcon,
  ShieldCheckIcon as ShieldIcon,
  FlagIcon,
  ArrowLeftOnRectangleIcon as LogoutIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/ui/Logo';

const navigation = [
  { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
  { name: 'Beta Waitlist', href: '/admin/waitlist', icon: UsersIcon },
  { name: 'Feedback', href: '/admin/feedback', icon: FeedbackIcon },
  { name: 'Settings', href: '/admin/settings', icon: SettingsIcon },
];

export function AdminLayout() {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border bg-background px-6 pb-4">
            <div className="flex h-16 items-center">
              <Link to="/admin" className="flex items-center gap-2">
                <Logo className="h-8 w-8" />
                <span className="text-xl font-semibold">Mapper Admin</span>
              </Link>
            </div>
            <nav className="mt-5 flex-1 space-y-1 px-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      isActive
                        ? 'bg-gray-100 dark:bg-gray-800 text-primary'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200',
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                    )}
                  >
                    <item.icon
                      className={cn(
                        isActive
                          ? 'text-primary'
                          : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400',
                        'mr-3 flex-shrink-0 h-5 w-5'
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex flex-shrink-0 border-t border-gray-200 dark:border-gray-800 p-4">
            <button
              onClick={signOut}
              className="group flex w-full items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
            >
              <LogoutIcon
                className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400"
                aria-hidden="true"
              />
              Sign out
            </button>
          </div>
        </div>
        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          <main className="flex-1">
            <div className="py-6">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                <Suspense fallback={
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
                  </div>
                }>
                  <Outlet />
                </Suspense>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
