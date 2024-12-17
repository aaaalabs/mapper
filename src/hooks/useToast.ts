import { useContext } from 'react';
import { ToastContext } from '@/components/ui/toast';

/**
 * Hook for managing toast notifications
 * @returns Object containing toast state and methods
 * @throws Error when used outside of ToastProvider
 */
export function useToast() {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
}
