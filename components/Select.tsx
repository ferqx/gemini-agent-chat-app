
import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';
import { useSmartPosition } from '../hooks/useSmartPosition';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  value,
  options,
  onChange,
  disabled = false,
  placeholder = 'Select...',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use smart position with ~250px required space for dropdown
  const position = useSmartPosition(containerRef, isOpen, 'bottom', 250);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center justify-between w-full gap-2 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg transition-all ${
          disabled 
            ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800' 
            : 'hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-primary-300 dark:hover:border-primary-700 cursor-pointer shadow-sm'
        } ${isOpen ? 'ring-2 ring-primary-500/20 border-primary-500' : ''}`}
      >
        <span className={`truncate ${!selectedOption ? 'text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <Icon 
          name="ChevronDown" 
          size={14} 
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && !disabled && (
        <div className={`absolute z-50 w-full min-w-[200px] right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 ${
          position === 'top' 
            ? 'bottom-full mb-2 origin-bottom' 
            : 'top-full mt-2 origin-top'
        }`}>
          <div className="max-h-60 overflow-auto p-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex flex-col gap-0.5 ${
                  value === option.value
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="font-medium">{option.label}</span>
                {option.description && (
                  <span className={`text-[10px] ${
                    value === option.value ? 'text-primary-500 dark:text-primary-400' : 'text-slate-400'
                  }`}>
                    {option.description}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
