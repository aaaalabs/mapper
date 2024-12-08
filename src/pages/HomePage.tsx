import React from 'react';
import { HeroSection } from '../components/sections/HeroSection';
import { QuickUpload } from '../components/sections/QuickUpload';
import { FeatureComparison } from '../components/sections/FeatureComparison';
import { SupportSection } from '../components/sections/SupportSection';
import { TestimonialSection } from '../components/sections/TestimonialSection';

export function HomePage() {
  return (
    <>
      <HeroSection />
      <QuickUpload />
      <FeatureComparison />
      <SupportSection />
      <TestimonialSection />
    </>
  );
}
