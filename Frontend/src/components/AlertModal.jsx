import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';

const AlertModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  type = 'info', 
  title, 
  message, 
  showCancel = false,
  confirmText = 'Okay',
  cancelText = 'Cancel',
  autoClose = false,
  autoCloseDuration = 3000 
}) => {
  useEffect(() => {
    if (isOpen && autoClose && !showCancel) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDuration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDuration, onClose, showCancel]);

  if (!isOpen) return null;

  const bgColors = {
    success: 'bg-green-50',
    error: 'bg-red-50',
    warning: 'bg-yellow-50',
    info: 'bg-blue-50'
  };

  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500'
  };

  const buttonColors = {
    success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    error: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
  };

  const Icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  };

  const IconComponent = Icons[type] || Info;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-[1vw] bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-[1vw] shadow-xl w-full max-w-[20vw] overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200"
        role="alertdialog"
        aria-modal="true"
      >
        <div className="p-[1.5vw]">
          <div className="flex items-start">
            <div className={`flex-shrink-0 p-[0.5vw] rounded-full ${bgColors[type] || bgColors.info}`}>
              <IconComponent size="1.5vw" className={iconColors[type] || iconColors.info} />
            </div>
            <div className="ml-[1vw] flex-1">
              <h3 className="text-[1vw] font-semibold text-gray-900">
                {title || type.charAt(0).toUpperCase() + type.slice(1)}
              </h3>
              <p className="mt-[0.2vw] text-[0.75vw] text-gray-600">
                {message}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="ml-[1vw] text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X size="1.2vw" />
            </button>
          </div>
        </div>
        
        <div className="bg-gray-50 px-[1.5vw] py-[1vw] flex justify-end gap-[0.8vw]">
          {showCancel && (
            <button
              onClick={onClose}
              className="px-[1vw] py-[0.5vw] text-[0.75vw] font-medium text-gray-700 bg-white border border-gray-300 rounded-[0.5vw] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => {
              if (onConfirm) onConfirm();
              else onClose();
            }}
            className={`px-[1vw] py-[0.5vw] text-[0.75vw] font-medium text-white rounded-[0.5vw] shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${buttonColors[type] || buttonColors.info}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
