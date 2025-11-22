import React, { useState, useRef, KeyboardEvent } from 'react';
import { Icon } from './Icon';
import { Attachment } from '../types';
import { translations, Language } from '../translations';
import { Tooltip } from './Tooltip';

interface ChatInputProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  isStreaming: boolean;
  language: Language;
  suggestions?: string[];
  isGeneratingSuggestions?: boolean;
  onClearSuggestions?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  isStreaming, 
  language, 
  suggestions = [], 
  isGeneratingSuggestions = false,
  onClearSuggestions
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const t = translations[language];

  const handleSend = () => {
    if ((!input.trim() && attachments.length === 0) || isStreaming) return;
    onSendMessage(input, attachments);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        setAttachments(prev => [...prev, {
          mimeType: file.type,
          data: base64Data,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
    setInput(target.value);
  };

  const showSuggestions = suggestions.length > 0 || isGeneratingSuggestions;

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      {/* Suggestions Chips (Floating above input) */}
      {showSuggestions && !isStreaming && (
        <div className="mb-3 animate-in slide-in-from-bottom-4 fade-in duration-500">
           <div className="flex items-center justify-between mb-2 px-2">
             <div className="flex items-center gap-1.5">
               <Icon name="Sparkles" size={12} className="text-primary-500" />
               <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                 {isGeneratingSuggestions ? 'Thinking...' : 'Suggested'}
               </span>
             </div>
             {onClearSuggestions && !isGeneratingSuggestions && (
               <Tooltip content={t.clearSuggestions} position="left">
                 <button 
                   onClick={onClearSuggestions}
                   className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                 >
                   <Icon name="X" size={12} />
                 </button>
               </Tooltip>
             )}
           </div>
           
           <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mask-gradient-r px-1">
              {isGeneratingSuggestions ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="h-8 w-24 bg-white/50 dark:bg-slate-800/50 rounded-full animate-pulse"></div>
                ))
              ) : (
                suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(suggestion, [])}
                    className="shrink-0 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm rounded-full shadow-sm hover:bg-white dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 hover:border-primary-200 dark:hover:border-primary-800"
                  >
                    {suggestion}
                  </button>
                ))
              )}
           </div>
        </div>
      )}

      {/* Main Floating Capsule with enhanced glassmorphism */}
      <div className="relative flex flex-col bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[1.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-black/50 ring-1 ring-slate-200/60 dark:ring-slate-700/60 transition-all focus-within:ring-2 focus-within:ring-primary-500/50 hover:shadow-primary-500/5 dark:hover:shadow-primary-500/10">
        
        {/* Attachments Area */}
        {attachments.length > 0 && (
          <div className="px-4 pt-4 flex gap-3 overflow-x-auto no-scrollbar">
            {attachments.map((att, idx) => (
              <div key={idx} className="relative group shrink-0">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 relative shadow-sm">
                  {att.mimeType.startsWith('image/') ? (
                    <img 
                      src={`data:${att.mimeType};base64,${att.data}`} 
                      alt="preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800">
                      <Icon name="File" size={24} className="text-slate-400" />
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(idx)}
                    className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-red-500 text-white rounded-full p-0.5 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={autoResize}
          onKeyDown={handleKeyDown}
          placeholder={t.messagePlaceholder}
          className="w-full py-4 px-5 bg-transparent border-none outline-none focus:outline-none focus:ring-0 resize-none text-[15px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 min-h-[56px] max-h-[200px] leading-relaxed"
          rows={1}
        />

        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 pb-3 pl-4">
           <div className="flex gap-2">
             <input
               type="file"
               ref={fileInputRef}
               className="hidden"
               onChange={handleFileChange}
               multiple
               accept="image/*"
             />
             <Tooltip content={t.addAttachment}>
               <button
                 onClick={() => fileInputRef.current?.click()}
                 className="p-2 rounded-xl text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 dark:hover:text-primary-400 transition-colors"
               >
                 <Icon name="Paperclip" size={20} />
               </button>
             </Tooltip>
           </div>

           <div className="flex items-center gap-2">
             <div className="text-[10px] text-slate-300 dark:text-slate-600 font-mono mr-2 hidden sm:block pointer-events-none select-none">
               {input.length > 0 ? `${input.length} chars` : 'Enter to send'}
             </div>
             <Tooltip content={t.sendMessage}>
               <button
                 onClick={handleSend}
                 disabled={(!input.trim() && attachments.length === 0) || isStreaming}
                 className={`p-2 rounded-xl transition-all duration-200 ${
                   (input.trim() || attachments.length > 0) && !isStreaming
                     ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30 hover:bg-primary-700 hover:scale-105 active:scale-95'
                     : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                 }`}
               >
                 {isStreaming ? (
                   <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
                 ) : (
                   <Icon name="ArrowUp" size={20} />
                 )}
               </button>
             </Tooltip>
           </div>
        </div>
      </div>
      
      <div className="text-center mt-2 opacity-0 hover:opacity-100 transition-opacity duration-500">
        <p className="text-[10px] text-slate-300 dark:text-slate-600">
          AI can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
};