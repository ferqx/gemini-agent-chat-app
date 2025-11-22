
import React, { useState, useRef } from 'react';
import { useSmartPosition, Position } from '../hooks/useSmartPosition';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
  position?: Position;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position: initialPosition = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Use shared hook for positioning, requiring about 50px of space
  const actualPosition = useSmartPosition(triggerRef, isVisible, initialPosition, 50);

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      ref={triggerRef}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-[60] px-2.5 py-1.5 text-[11px] font-medium text-white bg-slate-800 dark:bg-slate-700 rounded-lg shadow-xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-200 border border-slate-700 dark:border-slate-600 ${
          actualPosition === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' :
          actualPosition === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-2' :
          actualPosition === 'left' ? 'right-full top-1/2 -translate-y-1/2 mr-2' :
          'left-full top-1/2 -translate-y-1/2 ml-2'
        }`}>
          {content}
          <div className={`absolute w-2 h-2 bg-slate-800 dark:bg-slate-700 border-slate-700 dark:border-slate-600 transform rotate-45 ${
             actualPosition === 'top' ? 'bottom-[-5px] left-1/2 -translate-x-1/2 border-b border-r' :
             actualPosition === 'bottom' ? 'top-[-5px] left-1/2 -translate-x-1/2 border-t border-l' :
             actualPosition === 'left' ? 'right-[-5px] top-1/2 -translate-y-1/2 border-t border-r' :
             'left-[-5px] top-1/2 -translate-y-1/2 border-b border-l'
          }`}></div>
        </div>
      )}
    </div>
  );
};
