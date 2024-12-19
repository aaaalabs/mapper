import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  ChartBarIcon,
  UsersIcon,
  Cog6ToothIcon as SettingsIcon,
  ShieldCheckIcon as ShieldIcon,
  FlagIcon,
  ArrowLeftOnRectangleIcon as LogoutIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Logo } from '@/components/ui/Logo';

const navigation = [
  { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
  { name: 'User Management', href: '/admin/users', icon: UsersIcon },
  { name: 'Moderation', href: '/admin/moderation', icon: FlagIcon },
  { name: 'Security', href: '/admin/security', icon: ShieldIcon },
  { name: 'Settings', href: '/admin/settings', icon: SettingsIcon },
];

export function AdminLayout() {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-border bg-background-alt">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <Link to="/admin" className="flex items-center gap-2">
                <Logo className="h-8 w-8" />
                <span className="font-semibold text-foreground">
                  Admin Dashboard
                </span>
              </Link>
            </div>
            <nav className="mt-8 flex-1 space-y-1 px-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-5 w-5',
                        isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex flex-shrink-0 border-t border-border p-4">
            <div className="flex w-full items-center justify-between">
              <ThemeToggle />
              <button
                onClick={signOut}
                className="group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <LogoutIcon
                  className="h-5 w-5 text-muted-foreground group-hover:text-foreground"
                  aria-hidden="true"
                />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col md:pl-64">
        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
