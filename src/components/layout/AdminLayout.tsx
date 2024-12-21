import React, { Suspense, useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  ChartBarIcon,
  UsersIcon,
  Cog6ToothIcon as SettingsIcon,
  ChatBubbleLeftRightIcon as FeedbackIcon,
  ArrowLeftOnRectangleIcon as LogoutIcon,
  Bars3Icon,
  XMarkIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const navigation = [
  { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
  { name: 'Beta Waitlist', href: '/admin/waitlist', icon: UsersIcon },
  { name: 'Logs', href: '/admin/logs', icon: DocumentTextIcon },
  { name: 'Feedback', href: '/admin/feedback', icon: FeedbackIcon },
  { name: 'Settings', href: '/admin/settings', icon: SettingsIcon },
];

export function AdminLayout() {
  const location = useLocation();
  const { signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const NavLinks = ({ mobile = false, onItemClick = () => {} }) => (
    <>
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              isActive
                ? 'bg-accent/10 text-accent'
                : 'text-muted-foreground hover:bg-accent/5 hover:text-accent',
              'group flex items-center rounded-md transition-colors',
              mobile ? 'px-3 py-2.5 text-base' : 'px-3 py-2 text-sm'
            )}
            onClick={onItemClick}
          >
            <item.icon
              className={cn(
                isActive
                  ? 'text-accent'
                  : 'text-muted-foreground group-hover:text-accent',
                'mr-3 flex-shrink-0 transition-colors',
                mobile ? 'h-6 w-6' : 'h-5 w-5'
              )}
              aria-hidden="true"
            />
            {item.name}
          </Link>
        );
      })}
      <button
        onClick={() => {
          onItemClick();
          signOut();
        }}
        className={cn(
          'group flex w-full items-center rounded-md text-muted-foreground hover:bg-accent/5 hover:text-accent transition-colors',
          mobile ? 'px-3 py-2.5 text-base' : 'px-3 py-2 text-sm'
        )}
      >
        <LogoutIcon
          className={cn(
            'text-muted-foreground group-hover:text-accent transition-colors mr-3 flex-shrink-0',
            mobile ? 'h-6 w-6' : 'h-5 w-5'
          )}
          aria-hidden="true"
        />
        Sign out
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border bg-background px-6">
            <div className="flex h-16 items-center justify-between">
              <Link to="/admin" className="flex items-center gap-2">
                <Logo className="h-8 w-8" />
                <span className="text-xl font-semibold text-foreground">Mapper Admin</span>
              </Link>
              <ThemeToggle />
            </div>
            <nav className="flex flex-1 flex-col">
              <div className="space-y-1">
                <NavLinks />
              </div>
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col lg:pl-72">
          {/* Mobile header */}
          <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-background px-4 sm:gap-x-6 sm:px-6 lg:hidden">
            <button
              type="button"
              className="-m-2.5 p-2.5 text-muted-foreground hover:text-accent transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
            <Link to="/admin" className="flex items-center gap-2">
              <Logo className="h-8 w-8" />
              <span className="text-xl font-semibold text-foreground">Mapper Admin</span>
            </Link>
            <div className="flex flex-1 justify-end">
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile menu */}
          <div
            className={cn(
              'fixed inset-0 z-50 lg:hidden',
              isMobileMenuOpen ? 'visible' : 'invisible'
            )}
            aria-hidden={!isMobileMenuOpen}
          >
            {/* Background overlay */}
            <div
              className={cn(
                'fixed inset-0 bg-gray-900/80 transition-opacity duration-300',
                isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Mobile menu panel */}
            <div
              className={cn(
                'fixed inset-y-0 left-0 w-full overflow-y-auto bg-background px-4 pb-6 sm:max-w-sm sm:px-6 transform transition-transform duration-300',
                isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
              )}
            >
              <div className="flex h-16 items-center justify-between">
                <Link to="/admin" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <Logo className="h-8 w-8" />
                  <span className="text-xl font-semibold text-foreground">Mapper Admin</span>
                </Link>
                <button
                  type="button"
                  className="-m-2.5 p-2.5 text-muted-foreground hover:text-accent transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="sr-only">Close menu</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <nav className="mt-6 flow-root">
                <div className="space-y-1">
                  <NavLinks mobile onItemClick={() => setIsMobileMenuOpen(false)} />
                </div>
              </nav>
            </div>
          </div>

          <main className="flex-1">
            <div className="py-6">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
