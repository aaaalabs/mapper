import React, { useState } from 'react';
import { Navigation } from './components/layout/Navigation';
import { LoginModal } from './components/auth/LoginModal';
import { HeroSection } from './components/sections/HeroSection';
import { QuickUpload } from './components/sections/QuickUpload';
import { FeatureComparison } from './components/sections/FeatureComparison';
import { SupportSection } from './components/sections/SupportSection';
import { TestimonialSection } from './components/sections/TestimonialSection';

function App() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navigation onLoginClick={() => setShowLogin(true)} />
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      
      <main className="max-w-6xl mx-auto px-4 pt-16">
        <HeroSection />
        <QuickUpload />
        <FeatureComparison />
        <SupportSection />
        <TestimonialSection />
      </main>

      <footer className="mt-20 py-8 text-center text-tertiary">
        <p>© {new Date().getFullYear()} VoiceLoop. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;