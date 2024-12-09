import React from 'react';

interface EmbedLayoutProps {
  children: React.ReactNode;
}

export function EmbedLayout({ children }: EmbedLayoutProps) {
  return (
    <div className="w-screen h-screen overflow-hidden">
      {children}
    </div>
  );
}
