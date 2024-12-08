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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background-alt">
      <Navigation onLoginClick={() => setShowLogin(true)} />
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      
      <main className="max-w-6xl mx-auto px-4 pt-24 space-y-32">
        <HeroSection />
        <QuickUpload />
        <FeatureComparison />
        <SupportSection />
        <TestimonialSection />
      </main>

      <footer className="mt-32 py-8 text-center text-tertiary">
        <p>© {new Date().getFullYear()} VoiceLoop. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;