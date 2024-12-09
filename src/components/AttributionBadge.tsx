import React from 'react';
import { Logo } from './ui/Logo';

export function AttributionBadge() {
  return (
    <a
      href="https://mapper.voiceloop.io"
      target="_blank"
      rel="noopener noreferrer"
      className="attribution-badge"
    >
      <Logo className="w-4 h-4 text-primary" />
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
        powered by voiceloop.io
      </span>
    </a>
  );
}
