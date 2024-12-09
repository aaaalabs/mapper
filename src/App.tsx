import React, { useState } from 'react';
import { Navigation } from './components/layout/Navigation';
import { LoginModal } from './components/auth/LoginModal';
import { Footer } from './components/Footer';
import { InsightsPage } from './pages/InsightsPage';
import { Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';

function App() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background-alt">
      <Navigation onLoginClick={() => setShowLogin(true)} />
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      
      <main className="max-w-6xl mx-auto px-4 pt-24 space-y-32">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/insights" element={<InsightsPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;