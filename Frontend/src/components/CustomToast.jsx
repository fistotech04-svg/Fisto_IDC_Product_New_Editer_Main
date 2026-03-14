import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastItem = ({ id, message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleClose = useCallback(() => {
    setIsVisible(false); // Trigger exit animation (slide out)
    setTimeout(() => {
      onClose(id);
    }, 300); // Wait for animation to finish before unmounting
  }, [id, onClose]);

  useEffect(() => {
    // Trigger entrance animation (slide in) after mount
    const enterTimer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    // Auto-close after 3 seconds
    const closeTimer = setTimeout(() => {
      handleClose();
    }, 3000);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(closeTimer);
    };
  }, [handleClose]);

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  };

  const textColors = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800',
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  return (
    <div
      className={`
        flex items-center p-4 mb-3 rounded-lg border shadow-lg backdrop-blur-sm
        transition-all duration-300 ease-in-out transform
        ${bgColors[type] || bgColors.info}
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
      role="alert"
    >
      <div className="flex-shrink-0">
        {icons[type] || icons.info}
      </div>
      <div className={`ml-3 text-sm font-medium ${textColors[type] || textColors.info}`}>
        {message}
      </div>
      <button
        type="button"
        className={`ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 p-1.5 inline-flex h-8 w-8 hover:bg-white/20 ${textColors[type]}`}
        onClick={handleClose}
        aria-label="Close"
      >
        <span className="sr-only">Close</span>
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const value = {
    showToast: addToast,
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col w-full max-w-xs space-y-2 pointer-events-none overflow-hidden pr-2 py-2">
        {/* Pointer events none on container, auto on items. Overflow hidden to prevent scrollbars during animation if needed */}
        <div className="pointer-events-auto">
            {toasts.map((toast) => (
            <ToastItem
                key={toast.id}
                {...toast}
                onClose={removeToast}
            />
            ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};
