
import React, { useEffect } from 'react';

interface NotificationToastProps {
  show: boolean;
  title: string;
  message: React.ReactNode;
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ show, title, message, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-sm px-6">
      <div className="bg-rose-600 text-white rounded-2xl shadow-xl p-3.5 flex items-center gap-3 border border-rose-400/30 backdrop-blur-md animate-fadeIn">
        <div className="bg-white/20 p-1.5 rounded-xl shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-black text-xs uppercase tracking-tight leading-none mb-0.5">{title}</h4>
          <div className="text-rose-50 text-[11px] font-medium leading-tight truncate">{message}</div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
