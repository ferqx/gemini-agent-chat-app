
import React, { useState, useRef, useEffect } from 'react';
import { AVAILABLE_MODELS } from '../types';
import { Icon } from './Icon';
import { translations, Language } from '../translations';

interface ModelSelectorProps {
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  language: Language;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModelId, onSelectModel, language }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const t = translations[language];
  
  const selectedModel = AVAILABLE_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_MODELS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 transition-all border border-slate-200 dark:border-slate-800 shadow-sm"
        title={t.selectModel}
      >
        <Icon name="Box" size={14} className="text-primary-500" />
        <span className="hidden sm:inline">{selectedModel.name}</span>
        <Icon name="ChevronDown" size={14} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 ring-1 ring-black/5">
          <div className="py-1">
            <div className="px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
              <span>{t.selectModel}</span>
            </div>
            {AVAILABLE_MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onSelectModel(model.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-0 ${
                  selectedModelId === model.id ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                }`}
              >
                 <div className={`mt-0.5 ${selectedModelId === model.id ? 'text-primary-600 dark:text-primary-400' : 'text-slate-300 dark:text-slate-600'}`}>
                    <Icon name={selectedModelId === model.id ? 'CheckCircle2' : 'Circle'} size={16} />
                 </div>
                 <div className="flex-1">
                   <div className={`text-sm font-medium ${selectedModelId === model.id ? 'text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-200'}`}>
                     {model.name}
                   </div>
                   <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                     {language === 'zh' ? model.description_zh : model.description}
                   </div>
                 </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
