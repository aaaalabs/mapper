import React, { createContext, useContext, useState } from 'react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export { ToastContext };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              rounded-lg shadow-lg p-4 min-w-[300px] max-w-md
              animate-in slide-in-from-right-full
              ${
                toast.variant === 'destructive'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-800'
              }
            `}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{toast.title}</h3>
                {toast.description && (
                  <p className="text-sm mt-1 opacity-90">{toast.description}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-sm opacity-70 hover:opacity-100"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export const toast = (props: Omit<Toast, 'id'>) => {
  // This is a helper function that will be used outside of React components
  // We'll need to get the current toast context and add the toast
  const toastRoot = document.getElementById('toast-root');
  if (!toastRoot) {
    console.error('Toast root element not found');
    return;
  }

  const event = new CustomEvent('add-toast', { detail: props });
  toastRoot.dispatchEvent(event);
};
