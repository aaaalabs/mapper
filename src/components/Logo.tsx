import React from "react";
import { Logo as VoiceLoopLogo } from "./ui/Logo";

export const Logo = () => {
  return (
    <a
      href="https://voiceloop.io"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center space-x-2"
    >
      <VoiceLoopLogo className="h-8 w-8 text-primary" />
      <span className="text-lg font-semibold text-primary">
        voiceloop
      </span>
    </a>
  );
};
