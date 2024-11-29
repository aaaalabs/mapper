import React, { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';

interface LoadingOverlayProps {
  onComplete: () => void;
}

export function LoadingOverlay({ onComplete }: LoadingOverlayProps) {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const duration = 10000; // 10 seconds
    const interval = 100; // Update every 100ms
    const steps = duration / interval;
    const increment = 100 / steps;
    
    let currentProgress = 0;
    const timer = setInterval(() => {
      currentProgress += increment;
      
      if (currentProgress >= 100) {
        clearInterval(timer);
        setProgress(100);
        setTimeout(onComplete, 500);
      } else {
        setProgress(currentProgress);
      }
    }, interval);
    
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative bg-background-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <Globe className="w-16 h-16 text-accent animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-primary mb-2">Building Your Community Map</h3>
          <p className="text-secondary">Please wait while we process your data and generate the map...</p>
        </div>
        
        <div className="relative h-3 bg-background rounded-full overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent to-accent-alt transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="mt-4 text-center text-secondary">
          <span className="font-medium">{Math.round(progress)}%</span> Complete
        </div>
      </div>
    </div>
  );
}