import { useState } from 'react';
import { FilloutPopupEmbed } from "@fillout/react";
import "@fillout/react/style.css";
import { Button } from './ui/Button';
import { trackEvent } from '../services/analytics';

export function DemoCallButton() {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    trackEvent({
      event_name: 'demo_call_button_click',
      event_data: { location: 'header' }
    });
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant="secondary"
        onClick={handleOpen}
      >
        Schedule Demo Call
      </Button>

      {isOpen && (
        <FilloutPopupEmbed
          filloutId="foAdHjd1Duus"
          onClose={handleClose}
        />
      )}
    </>
  );
}
