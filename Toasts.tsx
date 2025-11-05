import React, { createContext, useState, useCallback, useContext, ReactNode, useEffect } from 'react';

// --- Toast Notification System ---

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToasts = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToasts must be used within a ToastProvider');
  }
  return context;
};

const Toast: React.FC<{ message: string, type: ToastType, onDismiss: () => void }> = ({ message, type, onDismiss }) => {
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000); // Auto-dismiss after 5 seconds
    return () => clearTimeout(timer);
  }, [onDismiss]);
  
  const typeStyles = {
    success: {
      bg: 'bg-green-100',
      border: 'border-green-500',
      text: 'text-green-800',
      icon: '✅'
    },
    error: {
      bg: 'bg-red-100',
      border: 'border-red-500',
      text: 'text-red-800',
      icon: '❌'
    },
    info: {
      bg: 'bg-sky-100',
      border: 'border-sky-500',
      text: 'text-sky-800',
      icon: 'ℹ️'
    }
  };

  const styles = typeStyles[type];

  return (
    <div className={`w-full max-w-sm p-4 rounded-lg shadow-lg flex items-start text-sm border-l-4 ${styles.bg} ${styles.border} ${styles.text} animate-toast-in`}>
      <span className='text-xl mr-3'>{styles.icon}</span>
      <p className='flex-grow'>{message}</p>
      <button onClick={onDismiss} className='ml-4 font-bold text-lg leading-none -mt-1'>×</button>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now() + Math.random();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className='fixed top-4 right-4 z-[100] space-y-2'>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </div>
      <style>{`
        @keyframes toast-in {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        .animate-toast-in {
            animation: toast-in 0.3s ease-out forwards;
        }
      `}</style>
    </ToastContext.Provider>
  );
};
