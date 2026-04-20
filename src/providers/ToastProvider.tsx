'use client';

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import ErrorToast from '@/components/ui/ErrorToast';

export interface Toast {
  id: string;
  type: 'error' | 'success';
  message: string;
  onRetry?: () => void;
}

interface ToastContextType {
  showError: (message: string, onRetry?: () => void) => string;
  showSuccess: (message: string) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const AUTO_DISMISS_MS = 5000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const addToast = useCallback(
    (type: 'error' | 'success', message: string, onRetry?: () => void) => {
      const id = `toast-${++counterRef.current}`;
      setToasts((prev) => [...prev, { id, type, message, onRetry }]);
      return id;
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showError = useCallback(
    (message: string, onRetry?: () => void) => addToast('error', message, onRetry),
    [addToast]
  );

  const showSuccess = useCallback(
    (message: string) => addToast('success', message),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ showError, showSuccess, dismiss }}>
      {children}
      <div aria-live="polite" className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast, index) => (
          <div key={toast.id} className="pointer-events-auto" style={{ transform: `translateY(-${index * 4}px)` }}>
            <ErrorToast
              message={toast.message}
              onRetry={toast.onRetry}
              onDismiss={() => dismiss(toast.id)}
              autoDismissMs={AUTO_DISMISS_MS}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast harus digunakan di dalam ToastProvider');
  }
  return context;
}
