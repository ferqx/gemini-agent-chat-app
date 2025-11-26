
import React, { useEffect } from 'react';
import { Icon } from './Icon';
import '../types';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: string;
  children: React.ReactNode;
  width?: string;
}

export const Drawer: React.FC<DrawerProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  icon, 
  children, 
  width = 'w-80' 
}) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  return (
    <div className={`absolute inset-0 z-30 pointer-events-none overflow-hidden ${isOpen ? 'pointer-events-auto' : ''}`}>
      {/* Invisible Backdrop to catch clicks outside */}
      {isOpen && (
        <div 
          className="absolute inset-0 bg-transparent" 
          onClick={onClose}
        />
      )}
      
      <div 
        className={`absolute top-0 right-0 bottom-0 ${width} bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-slate-200 dark:border-slate-800 flex flex-col h-full pointer-events-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md shrink-0">
           <div className="flex items-center gap-2 font-bold text-sm text-slate-700 dark:text-slate-200">
              {icon && <Icon name={icon} size={16} className="text-primary-500" />}
              {title}
           </div>
           <button 
             onClick={onClose}
             className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
           >
              <Icon name="X" size={16} />
           </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
           {children}
        </div>
      </div>
    </div>
  );
};
