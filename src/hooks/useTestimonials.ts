import { useState, useEffect } from 'react';
import { Testimonial } from '../types/testimonial';
import { getTestimonials } from '../services/testimonialService';

const ROTATION_INTERVAL = 10000; // 10 seconds

export function useTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch testimonials
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const data = await getTestimonials();
        setTestimonials(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load testimonials');
        // Fallback testimonials for development
        setTestimonials([
          {
            name: "Sarah Chen",
            image_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
            career_stage: "Senior Designer",
            logo_url: null,
            content: "VoiceLoop's matching helped me find the perfect collaboration partners. Their understanding of community dynamics is unmatched."
          },
          {
            name: "Michael Rodriguez",
            image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
            career_stage: "Tech Lead",
            logo_url: null,
            content: "The community mapping feature transformed how we organize local meetups. It's been a game-changer for our global team."
          },
          {
            name: "Emma Thompson",
            image_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
            career_stage: "Product Manager",
            logo_url: null,
            content: "What impressed me most was how quickly we could visualize our entire community. The insights we gained were invaluable."
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  // Rotate testimonials
  useEffect(() => {
    if (testimonials.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % testimonials.length);
    }, ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  return {
    currentTestimonial: testimonials[currentIndex],
    isLoading,
    error,
    totalTestimonials: testimonials.length,
    currentIndex
  };
}