import React, { useState } from 'react';
import { 
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
  useRouteError,
  isRouteErrorResponse
} from 'react-router-dom';
import { Navigation } from './components/layout/Navigation';
import { LoginModal } from './components/auth/LoginModal';
import { AdminLogin } from './components/auth/AdminLogin';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { SharedMap } from './pages/SharedMap';
import { EmbedMap } from './pages/EmbedMap';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/ui/toast';
import { OrderPage } from './pages/OrderPage';
import { ThemeProvider } from './contexts/ThemeContext';
import { AdminLayout } from './components/layout/AdminLayout';
import { DashboardContent } from './components/insights/DashboardContent';
import { BetaWaitlist } from './components/admin/BetaWaitlist';
import { UserManagement } from './components/admin/UserManagement';
import { ContentModeration } from './components/admin/ContentModeration';
import { AdminSettings } from './components/insights/AdminSettings';
import { useAuth } from './hooks/useAuth';
import { XCircleIcon } from '@heroicons/react/24/outline';

function RouteError() {
  const error = useRouteError();
  const isRouteError = isRouteErrorResponse(error);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30">
          <XCircleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {isRouteError ? `${error.status} - ${error.statusText}` : 'Something went wrong'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {isRouteError && error.status === 404 
            ? "The page you're looking for doesn't exist."
            : "We're having trouble loading this page."}
        </p>
        <div className="pt-4">
          <a
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
          >
            Go back home
          </a>
        </div>
      </div>
    </div>
  );
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" />;
  }

  return <>{children}</>;
};

const AppLayout = () => {
  const [showLogin, setShowLogin] = useState(false);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background-alt">
      <Navigation onLoginClick={() => setShowLogin(true)} />
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      <main className="max-w-6xl mx-auto px-4 pt-24 space-y-32">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'map/:id', element: <SharedMap /> },
      { path: 'map/:id/embed', element: <EmbedMap /> },
      { path: 'embed/:id', element: <EmbedMap /> },
      { 
        path: 'insights',
        element: <Navigate to="/admin/analytics" replace />
      }
    ]
  },
  {
    path: '/admin/login',
    element: <AdminLogin />,
    errorElement: <RouteError />
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="/admin/analytics" replace /> },
      { path: 'analytics', element: <DashboardContent /> },
      { path: 'waitlist', element: <BetaWaitlist /> },
      { path: 'users', element: <UserManagement /> },
      { path: 'moderation', element: <ContentModeration /> },
      { path: 'settings', element: <AdminSettings currentUserId="" isLoading={false} /> }
    ]
  },
  {
    path: 'order',
    element: <OrderPage />,
    errorElement: <RouteError />
  }
]);

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ErrorBoundary>
          <RouterProvider router={router} />
        </ErrorBoundary>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;