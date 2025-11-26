
import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { translations, Language } from '../translations';
import '../types';

interface ApiKeyModalProps {
  isOpen: boolean;
  onSave: (url: string, key: string) => void;
  onClose: () => void;
  language: Language;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onSave, onClose, language }) => {
  const [apiKey, setApiKey] = useState('');
  const [serviceUrl, setServiceUrl] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const t = translations[language];

  useEffect(() => {
    // If no initial key provided, check storage
    const storedKey = localStorage.getItem('agno_api_key');
    const storedUrl = localStorage.getItem('agno_base_url');
    if (storedKey) setApiKey(storedKey);
    if (storedUrl) setServiceUrl(storedUrl);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (serviceUrl.trim()) {
      localStorage.setItem('agno_base_url', serviceUrl.trim());
      // Only set API key if provided (can be empty)
      if (apiKey.trim()) {
        localStorage.setItem('agno_api_key', apiKey.trim());
      } else {
        localStorage.removeItem('agno_api_key');
      }
      onSave(serviceUrl.trim(), apiKey.trim());
      onClose(); // Auto close on save
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 transform transition-all">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
               <Icon name="Server" className="text-primary-600 dark:text-primary-400" size={24} />
             </div>
             <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.connectionSettings}</h2>
          </div>
          
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            {t.connectionText}
          </p>

          <form onSubmit={handleSubmit}>
            {/* Service URL Input */}
            <div className="mb-4">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">{t.serviceUrl} <span className="text-red-500">*</span></label>
               <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="Link" size={16} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  value={serviceUrl}
                  onChange={(e) => setServiceUrl(e.target.value)}
                  placeholder={t.serviceUrlHint}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-slate-800 dark:text-slate-200 text-sm font-mono"
                  autoFocus
                  required
                />
               </div>
            </div>

            {/* API Key Input */}
            <div className="mb-6">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">{t.apiKeyOptional}</label>
               <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="Lock" size={16} className="text-slate-400" />
                </div>
                <input
                  type={isVisible ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Agno API Key..."
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-slate-800 dark:text-slate-200 text-sm font-mono"
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
            </div>

            <div className="flex justify-end gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={!serviceUrl.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-lg shadow-primary-600/20"
              >
                {t.saveSettings}
              </button>
            </div>
          </form>
          
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <a 
              href="https://agno.com" 
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
