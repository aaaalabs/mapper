import React from 'react';
import { Info } from 'lucide-react';

interface InfoBoxProps {
  title: string;
  children: React.ReactNode;
}

export function InfoBox({ title, children }: InfoBoxProps) {
  return (
    <div className="mt-4 p-4 bg-background rounded-lg border border-tertiary/20">
      <h3 className="font-semibold mb-2 flex items-center gap-2 text-primary">
        <Info className="w-5 h-5 text-accent" />
        {title}
      </h3>
      <div className="text-sm text-secondary">
        {children}
      </div>
    </div>
  );
}