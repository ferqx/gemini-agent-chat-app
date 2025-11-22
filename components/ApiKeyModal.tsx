
import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { translations, Language } from '../translations';

interface ApiKeyModalProps {
  isOpen: boolean;
  onSave: (key: string) => void;
  onClose: () => void;
  initialKey?: string;
  language: Language;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onSave, onClose, initialKey = '', language }) => {
  const [key, setKey] = useState(initialKey);
  const [isVisible, setIsVisible] = useState(false);
  const t = translations[language];

  useEffect(() => {
    setKey(initialKey);
  }, [initialKey, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      onSave(key.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 transform transition-all">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
               <Icon name="Key" className="text-primary-600 dark:text-primary-400" size={24} />
             </div>
             <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.apiKeyTitle}</h2>
          </div>
          
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            {t.apiKeyText}
          </p>

          <form onSubmit={handleSubmit}>
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="Lock" size={16} className="text-slate-400" />
              </div>
              <input
                type={isVisible ? "text" : "password"}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="sk-..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-slate-800 dark:text-slate-200 text-sm font-mono"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                tabIndex={-1}
              >
                <Icon name={isVisible ? "EyeOff" : "Eye"} size={16} />
              </button>
            </div>

            <div className="flex justify-end gap-3">
              {initialKey && (
                <button 
                  type="button" 
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  {t.cancel}
                </button>
              )}
              <button
                type="submit"
                disabled={!key.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-lg shadow-primary-600/20"
              >
                {t.saveApiKey}
              </button>
            </div>
          </form>
          
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 flex items-center justify-center gap-1 hover:underline"
            >
              <span>{t.getApiKey}</span>
              <Icon name="ExternalLink" size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
