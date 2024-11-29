import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

interface PricingSliderProps {
  onPlanChange: (plan: 'free' | 'paid') => void;
  className?: string;
}

export function PricingSlider({ onPlanChange, className }: PricingSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  const updatePosition = (clientX: number) => {
    if (!sliderRef.current || !handleRef.current) return;
    
    const sliderRect = sliderRef.current.getBoundingClientRect();
    const handleWidth = handleRef.current.offsetWidth;
    const maxPosition = sliderRect.width - handleWidth;
    
    let newPosition = clientX - sliderRect.left - (handleWidth / 2);
    newPosition = Math.max(0, Math.min(newPosition, maxPosition));
    
    // Snap to positions
    if (newPosition < maxPosition / 2) {
      newPosition = 0;
      onPlanChange('free');
    } else {
      newPosition = maxPosition;
      onPlanChange('paid');
    }
    
    setPosition(newPosition);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updatePosition(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    updatePosition(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      updatePosition(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      updatePosition(e.touches[0].clientX);
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  return (
    <div className={cn("relative select-none", className)}>
      <div 
        ref={sliderRef}
        className="h-12 bg-background rounded-full shadow-inner relative"
      >
        {/* Track Background */}
        <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
          <span className="text-sm font-medium text-secondary">Free</span>
          <span className="text-sm font-medium text-secondary">Paid</span>
        </div>

        {/* Handle */}
        <div
          ref={handleRef}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg cursor-grab",
            "transition-shadow duration-200 flex items-center justify-center",
            isDragging && "cursor-grabbing shadow-xl scale-105",
            "before:absolute before:inset-0 before:rounded-full before:ring-4 before:ring-accent/20"
          )}
          style={{ 
            left: `${position}px`,
            transition: isDragging ? 'none' : 'all 0.3s ease'
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={1}
          aria-valuenow={position > 0 ? 1 : 0}
          tabIndex={0}
        >
          <div className="w-2 h-2 rounded-full bg-accent" />
        </div>
      </div>

      {/* Labels */}
      <div className="mt-4 flex justify-between px-4">
        <div className="text-center">
          <p className="font-medium text-primary">Free Plan</p>
          <p className="text-sm text-secondary">0 team members</p>
        </div>
        <div className="text-center">
          <p className="font-medium text-primary">Pro Plan</p>
          <p className="text-sm text-secondary">Unlimited members</p>
        </div>
      </div>
    </div>
  );
}