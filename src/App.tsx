import React, { useState, useEffect } from 'react';
import { 
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
  useRouteError,
  isRouteErrorResponse,
  useNavigate
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
import { AdminSettings } from './components/insights/AdminSettings';
import { Logs } from './components/admin/Logs';
import { useAuth } from './hooks/useAuth';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { trackErrorWithContext, ErrorSeverity, ErrorCategory } from './services/errorTracking';
import { usePerformanceTracking } from './hooks/usePerformanceTracking';
import { Orders } from './components/admin/Orders';
import { Leads } from './components/admin/Leads'; // Fixed Leads import to use named import
import { ContentModeration } from './components/admin/ContentModeration';
import { FeedbackDashboard } from './components/admin/FeedbackDashboard';
import { Maps } from './components/admin/Maps';

function RouteError() {
  const error = useRouteError();
  const isRouteError = isRouteErrorResponse(error);

  useEffect(() => {
    trackErrorWithContext(
      error instanceof Error ? error : new Error(isRouteError ? `${error.status} - ${error.statusText}` : 'Route Error'),
      {
        category: 'SYSTEM' as ErrorCategory,
        subcategory: 'ROUTING',
        severity: ErrorSeverity.HIGH,
        componentName: 'RouteError',
        action: 'route_error',
        metadata: {
          status: isRouteError ? error.status?.toString() : undefined,
          statusText: isRouteError ? error.statusText : undefined,
          path: window.location.pathname,
          timestamp: new Date().toISOString()
        }
      }
    );
  }, [error, isRouteError]);

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
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return isAdmin ? <>{children}</> : null;
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
      {
        index: true,
        element: <HomePage />
      },
      {
        path: 'insights',
        element: <Navigate to="/admin/analytics" replace />
      },
      {
        path: 'shared/:id',
        element: <SharedMap />
      },
      {
        path: 'embed/:id',
        element: <EmbedMap />
      },
      {
        path: 'map/:id',
        element: <SharedMap />
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
      { index: true, element: <Navigate to="/admin/settings" replace /> },
      { path: 'settings', element: <AdminSettings /> },
      { path: 'analytics', element: <DashboardContent /> },
      { path: 'orders', element: <Orders /> },
      { path: 'leads', element: <Leads /> },
      { path: 'logs', element: <Logs /> },
      { path: 'content', element: <ContentModeration /> },
      { path: 'waitlist', element: <BetaWaitlist /> },
      { path: 'feedback', element: <FeedbackDashboard /> },
      { path: 'dashboard', element: <DashboardContent /> },
      { path: 'maps', element: <Maps /> }
    ]
  },
  {
    path: 'order',
    element: <OrderPage />,
    errorElement: <RouteError />
  }
]);

function App() {
  // Initialize performance tracking
  usePerformanceTracking();

  useEffect(() => {
    // Global error handler for uncaught errors
    const handleUnhandledError = (event: ErrorEvent) => {
      trackErrorWithContext(event.error || new Error(event.message), {
        category: 'SYSTEM' as ErrorCategory,
        subcategory: 'CRASH',
        severity: ErrorSeverity.HIGH,
        metadata: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno?.toString(),
          colno: event.colno?.toString(),
          stack: event.error?.stack,
          timestamp: new Date().toISOString()
        }
      });
    };

    // Global handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackErrorWithContext(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          category: 'SYSTEM' as ErrorCategory,
          subcategory: 'CRASH',
          severity: ErrorSeverity.HIGH,
          metadata: {
            type: 'unhandled_rejection',
            error: String(event.reason),
            timestamp: new Date().toISOString()
          }
        }
      );
    };

    // Global handler for network errors
    const handleNetworkError = () => {
      const error = new Error('Network request failed');
      trackErrorWithContext(error, {
        category: 'SYSTEM' as ErrorCategory,
        subcategory: 'NETWORK',
        severity: ErrorSeverity.HIGH,
        componentName: 'App',
        metadata: {
          online: navigator.onLine.toString(),
          timestamp: new Date().toISOString()
        }
      });
    };

    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('offline', handleNetworkError);

    return () => {
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('offline', handleNetworkError);
    };
  }, []);

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