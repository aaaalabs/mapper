import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { Navigation } from './components/layout/Navigation';
import { LoginModal } from './components/auth/LoginModal';
import { AdminLogin } from './components/auth/AdminLogin';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { InsightsPage } from './pages/InsightsPage';
import { SharedMap } from './pages/SharedMap';
import { EmbedMap } from './pages/EmbedMap';
import { ErrorBoundary } from './components/ErrorBoundary';

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

const App = () => {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="insights" element={<InsightsPage />} />
          </Route>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/map/:id" element={<SharedMap />} />
          <Route path="/map/:id/embed" element={<EmbedMap />} />
          <Route path="/embed/:id" element={<EmbedMap />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
};

export default App;