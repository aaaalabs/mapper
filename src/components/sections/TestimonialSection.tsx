import React from 'react';
import { useTestimonials } from '../../hooks/useTestimonials';
import { cn } from '../../utils/cn';

export function TestimonialSection() {
  const { 
    currentTestimonial, 
    isLoading, 
    error, 
    totalTestimonials, 
    currentIndex 
  } = useTestimonials();

  if (error) return null;
  if (isLoading || !currentTestimonial) return null;

  return (
    <div className="mb-16 relative overflow-hidden">
      <div className="max-w-2xl mx-auto px-4">
        {/* Testimonial Content */}
        <div 
          className="relative transition-all duration-1000 ease-in-out"
          style={{ transform: 'translateZ(0)' }}
        >
          <div className="flex items-center justify-center gap-4 mb-6 relative">
            {currentTestimonial.image_url && (
              <div className="relative">
                <img 
                  src={currentTestimonial.image_url} 
                  alt={currentTestimonial.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-background-white shadow-md transition-transform duration-1000 ease-in-out"
                />
                {currentTestimonial.logo_url && (
                  <div className="absolute -bottom-2 -right-2 transform translate-x-[15%]">
                    <img 
                      src={currentTestimonial.logo_url} 
                      alt="Company Logo"
                      className="w-8 h-8 rounded-full border-2 border-background-white shadow-sm opacity-80 transition-all duration-1000"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <blockquote 
            className="text-center transform transition-all duration-1000 ease-in-out animate-fadeSlideUp"
          >
            <p className="text-lg italic mb-4 text-secondary leading-relaxed">
              "{currentTestimonial.content}"
            </p>
            <footer className="text-primary transform transition-all duration-1000 delay-200">
              <cite className="not-italic">
                <span className="font-medium block">{currentTestimonial.name}</span>
                {currentTestimonial.career_stage && (
                  <span className="text-sm text-tertiary block mt-1">
                    {currentTestimonial.career_stage}
                  </span>
                )}
              </cite>
            </footer>
          </blockquote>
        </div>

        {/* Progress Indicators */}
        {totalTestimonials > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: totalTestimonials }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1 rounded-full transition-all duration-800",
                  index === currentIndex 
                    ? "w-8 bg-accent" 
                    : "w-2 bg-tertiary/30"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}