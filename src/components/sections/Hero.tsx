import React from 'react';
import { ChevronRight, FileDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { generateDemoCsv } from '../../utils/demoData';

export function Hero() {
  const scrollToUpload = () => {
    const uploadSection = document.getElementById('map-upload');
    if (uploadSection) {
      uploadSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleGenerateDemo = () => {
    const csvContent = generateDemoCsv();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'demo-community-map.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    // Scroll to upload section after download
    setTimeout(scrollToUpload, 100);
  };

  return (
    <div className="pt-32 pb-16 text-center">
      <h1 className="text-4xl md:text-6xl font-bold mb-6 max-w-4xl mx-auto">
        Visualize Your Community's
        <br />
        <span className="gradient-text">Global Reach</span>
      </h1>
      
      <p className="text-xl text-secondary max-w-2xl mx-auto mb-8">
        Transform your community into an interactive map. See where your members are, facilitate local connections, and unlock the power of proximity.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          size="lg" 
          className="group"
          onClick={scrollToUpload}
        >
          Get Started
          <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
        </Button>
        <Button 
          variant="outline" 
          size="lg"
          onClick={handleGenerateDemo}
          className="group"
        >
          Generate Demo CSV
          <FileDown className="ml-2 h-5 w-5 group-hover:translate-y-0.5 transition-transform" />
        </Button>
      </div>
    </div>
  );
}