import React from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Hero } from './components/sections/Hero';
import { Features } from './components/sections/Features';
import { MapDemo } from './components/sections/MapDemo';
import { Pricing } from './components/sections/Pricing';

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <MapDemo />
        <Features />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}

export default App;