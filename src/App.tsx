import React, { useState } from 'react';
import { Navigation } from './components/layout/Navigation';
import { LoginModal } from './components/auth/LoginModal';
import { Footer } from './components/Footer';
import { Outlet } from 'react-router-dom';

function App() {
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
}

export default App;