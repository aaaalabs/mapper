import React, { useState } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Outlet,
  createBrowserRouter,
  RouterProvider
} from 'react-router-dom';
import { Navigation } from './components/layout/Navigation';
import { LoginModal } from './components/auth/LoginModal';
import { AdminLogin } from './components/auth/AdminLogin';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { InsightsPage } from './pages/InsightsPage';
import { SharedMap } from './pages/SharedMap';
import { EmbedMap } from './pages/EmbedMap';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/ui/toast';
import { OrderPage } from './pages/OrderPage';

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
    children: [
      { index: true, element: <HomePage /> },
      { path: 'insights', element: <InsightsPage /> },
      { path: 'map/:id', element: <SharedMap /> },
      { path: 'map/:id/embed', element: <EmbedMap /> },
      { path: 'embed/:id', element: <EmbedMap /> },
      { path: 'admin/login', element: <AdminLogin /> }
    ]
  },
  // Standalone routes
  {
    path: '/order',
    element: <OrderPage />
  }
]);

export function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;