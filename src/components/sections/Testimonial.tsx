import React from 'react';

export function Testimonial() {
  return (
    <div className="mb-16">
      <div className="flex items-center justify-center gap-4 mb-6">
        <img src="/api/placeholder/40/40" alt="VoiceLoop Success" className="rounded-full" />
      </div>
      <p className="italic max-w-xl mx-auto text-center text-secondary">
        "VoiceLoop's matching helped me find the perfect collaboration partners within AAA. Their understanding of community dynamics is unmatched."
      </p>
      <p className="text-sm font-medium mt-2 text-center text-primary">
        Rado K. - AAA Community Member
      </p>
    </div>
  );
}