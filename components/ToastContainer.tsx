import React from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Notification } from '../types';

const ToastContainer: React.FC = () => {
  const { notifications, removeNotification } = useStore();

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle size={20} className="text-green-500" />;
      case 'error': return <AlertCircle size={20} className="text-red-500" />;
      case 'warning': return <AlertTriangle size={20} className="text-yellow-500" />;
      case 'info': return <Info size={20} className="text-blue-500" />;
    }
  };

  const getStyles = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'border-green-100 bg-white dark:bg-slate-800 dark:border-green-900/30';
      case 'error': return 'border-red-100 bg-white dark:bg-slate-800 dark:border-red-900/30';
      case 'warning': return 'border-yellow-100 bg-white dark:bg-slate-800 dark:border-yellow-900/30';
      case 'info': return 'border-blue-100 bg-white dark:bg-slate-800 dark:border-blue-900/30';
    }
  };

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {notifications.map((notification) => (
        <div 
          key={notification.id}
          className={`
            pointer-events-auto
            flex items-center gap-3 p-4 rounded-xl shadow-lg border
            animate-in slide-in-from-top-4 fade-in duration-300
            ${getStyles(notification.type)}
          `}
        >
          {getIcon(notification.type)}
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100 flex-1">{notification.message}</p>
          <button 
            onClick={() => removeNotification(notification.id)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;