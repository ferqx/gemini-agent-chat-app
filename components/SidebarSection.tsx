
import React from 'react';
import { Icon } from './Icon';
import '../types';

interface SidebarSectionProps {
  title: string;
  icon: string;
  count?: number;
  isOpen: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}

export const SidebarSection: React.FC<SidebarSectionProps> = ({ 
  title, 
  icon, 
  count, 
  isOpen, 
  onToggle, 
  children 
}) => (
  <div className="border-b border-slate-100 dark:border-slate-800/50 last:border-0">
    <button 
      onClick={onToggle}
      className="w-full flex items-center justify-between p-3 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors uppercase tracking-wider"
    >
      <div className="flex items-center gap-2">
        <Icon name={icon} size={14} />
        <span>{title}</span>
      </div>
      <div className="flex items-center gap-2">
        {count !== undefined && (
          <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[9px] min-w-[1.5em] text-center text-slate-600 dark:text-slate-400">
            {count}
          </span>
        )}
        <Icon name="ChevronDown" size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
    </button>
    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
      <div className="px-2 pb-2 space-y-0.5">
        {children}
      </div>
    </div>
  </div>
);
