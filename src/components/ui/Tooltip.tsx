import { useState, useRef } from 'react';
import { Popover } from '@headlessui/react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string;
}

export function Tooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  className
}: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Calculate position classes based on side and align props
  const positionClasses = {
    top: {
      start: '-top-2 left-0 -translate-y-full',
      center: '-top-2 left-1/2 -translate-x-1/2 -translate-y-full',
      end: '-top-2 right-0 -translate-y-full'
    },
    right: {
      start: 'top-0 left-full translate-x-2',
      center: 'top-1/2 left-full -translate-y-1/2 translate-x-2',
      end: 'bottom-0 left-full translate-x-2'
    },
    bottom: {
      start: 'top-full left-0 translate-y-2',
      center: 'top-full left-1/2 -translate-x-1/2 translate-y-2',
      end: 'top-full right-0 translate-y-2'
    },
    left: {
      start: 'top-0 right-full -translate-x-2',
      center: 'top-1/2 right-full -translate-y-1/2 -translate-x-2',
      end: 'bottom-0 right-full -translate-x-2'
    }
  };

  return (
    <Popover className="relative inline-block">
      {({ open }) => (
        <>
          <Popover.Button
            ref={buttonRef}
            className="outline-none"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setIsOpen(false)}
          >
            {children}
          </Popover.Button>

          {isOpen && (
            <Popover.Panel
              static
              className={cn(
                'absolute z-50 px-3 py-2 text-sm',
                'bg-popover text-popover-foreground',
                'rounded-md shadow-md',
                'animate-in fade-in-0 zoom-in-95',
                'select-none pointer-events-none',
                positionClasses[side][align],
                className
              )}
            >
              {content}
            </Popover.Panel>
          )}
        </>
      )}
    </Popover>
  );
}
