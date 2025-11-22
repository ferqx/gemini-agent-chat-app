
import React, { useState, useRef, useEffect } from 'react';
import { AgentConfig, AGENTS } from '../types';
import { Icon } from './Icon';
import { translations, Language } from '../translations';

interface AgentSelectorProps {
  currentAgent: AgentConfig;
  onSelectAgent: (agent: AgentConfig) => void;
  language: Language;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({ currentAgent, onSelectAgent, language }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const t = translations[language];

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
    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30" ref={containerRef}>
      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">
        {t.activeAgent}
      </div>
      
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-primary-400 transition-all text-left"
        >
          <div className={`p-1.5 rounded-lg bg-primary-50 dark:bg-slate-900 shrink-0`}>
            <Icon name={currentAgent.icon} className={currentAgent.color} size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {language === 'zh' ? currentAgent.name_zh : currentAgent.name}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {language === 'zh' ? currentAgent.description_zh : currentAgent.description}
            </p>
          </div>
          <Icon name="ChevronUp" size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 max-h-[300px] overflow-y-auto ring-1 ring-black/5">
            <div className="p-1 space-y-0.5">
              {AGENTS.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => {
                    onSelectAgent(agent);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                    currentAgent.id === agent.id
                      ? 'bg-primary-50 dark:bg-slate-800/80'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className={`p-1.5 rounded-md shrink-0 ${
                    currentAgent.id === agent.id ? 'bg-white dark:bg-slate-900' : 'bg-slate-100 dark:bg-slate-900'
                  }`}>
                    <Icon name={agent.icon} className={agent.color} size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${
                      currentAgent.id === agent.id ? 'text-primary-700 dark:text-primary-400' : 'text-slate-700 dark:text-slate-200'
                    }`}>
                      {language === 'zh' ? agent.name_zh : agent.name}
                    </div>
                  </div>
                  {currentAgent.id === agent.id && (
                    <Icon name="Check" size={14} className="text-primary-600 dark:text-primary-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
