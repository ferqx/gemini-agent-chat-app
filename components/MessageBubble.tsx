




import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, Role, AGENTS, UserProfile } from '../types';
import { Icon } from './Icon';
import { translations, Language } from '../translations';
import { Tooltip } from './Tooltip';
import { WidgetRenderer } from '../gen-components/GenerativeWidgets';
import { ExecutionTrace } from './ExecutionTrace';

interface MessageBubbleProps {
  message: Message;
  onEdit?: (newText: string) => void;
  onFeedback?: (type: 'up' | 'down') => void;
  onDelete?: () => void;
  onInteract?: (type: string, data: any) => void;
  isLast?: boolean;
  language: Language;
  userProfile: UserProfile;
}

const useSmoothText = (targetText: string, isStreaming: boolean | undefined) => {
  const [currentText, setCurrentText] = useState(isStreaming ? '' : targetText);
  const textRef = useRef(targetText);
  const indexRef = useRef(isStreaming ? 0 : targetText.length);

  useEffect(() => {
    textRef.current = targetText;
    if (!isStreaming) {
      setCurrentText(targetText);
      indexRef.current = targetText.length;
    }
  }, [targetText, isStreaming]);

  useEffect(() => {
    if (!isStreaming) return;
    let animationFrameId: number;
    const animate = () => {
      const targetLen = textRef.current.length;
      const currentLen = indexRef.current;
      if (currentLen < targetLen) {
        const delta = targetLen - currentLen;
        const step = Math.max(1, Math.min(5, Math.ceil(delta / 10)));
        indexRef.current = Math.min(currentLen + step, targetLen);
        setCurrentText(textRef.current.slice(0, indexRef.current));
        animationFrameId = requestAnimationFrame(animate);
      } else {
        animationFrameId = requestAnimationFrame(animate);
      }
    };
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isStreaming]);

  return currentText;
};

// Helper to split text into markdown chunks and widget chunks
const parseContent = (text: string) => {
  const regex = /(:::widget[\s\S]*?:::)/g;
  const parts = text.split(regex);
  return parts.map(part => {
    if (part.startsWith(':::widget') && part.endsWith(':::')) {
      try {
        const jsonStr = part.replace(/^:::widget\s*/, '').replace(/\s*:::$/, '');
        const widgetData = JSON.parse(jsonStr);
        return { type: 'widget', content: widgetData };
      } catch (e) {
        return { type: 'text', content: part }; // Fallback if parse fails
      }
    }
    return { type: 'text', content: part };
  });
};

const MessageBubbleBase: React.FC<MessageBubbleProps> = ({ message, onEdit, onFeedback, onDelete, onInteract, isLast, language, userProfile }) => {
  const isUser = message.role === Role.USER;
  const t = translations[language];
  
  let displayName = '';
  if (isUser) {
    displayName = userProfile.name || t.you;
  } else {
    const agentConfig = AGENTS.find(a => a.name === message.agentName) || AGENTS[0];
    displayName = language === 'zh' && agentConfig.name === message.agentName ? agentConfig.name_zh : (message.agentName || agentConfig.name);
  }

  const agentConfig = !isUser ? (AGENTS.find(a => a.name === message.agentName) || AGENTS[0]) : null;
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const smoothText = useSmoothText(message.text, message.isStreaming && message.role === Role.MODEL);
  const displayText = (message.role === Role.MODEL && message.isStreaming) ? smoothText : message.text;

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  const handleSaveEdit = () => {
    if (editText.trim() !== message.text && onEdit) onEdit(editText);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(message.text);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const contentParts = parseContent(displayText);

  return (
    <div className={`flex w-full gap-4 mb-4 group animate-in fade-in slide-in-from-bottom-2 duration-300 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 mt-1 rounded-lg flex items-center justify-center shadow-sm overflow-hidden transition-colors duration-300 ${
        isUser 
          ? 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600' 
          : 'bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700'
      }`}>
        {isUser ? (
          userProfile.avatar ? (
            <img src={userProfile.avatar} alt="User" className="w-full h-full object-cover" />
          ) : (
            <Icon name="User" size={16} className="text-slate-600 dark:text-slate-300" />
          )
        ) : (
          agentConfig && <Icon name={agentConfig.icon} size={18} className="text-primary-600 dark:text-primary-400" />
        )}
      </div>

      {/* Content */}
      <div className={`flex flex-col max-w-[90%] lg:max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`flex items-center gap-2 mb-1.5 px-1 text-xs ${isUser ? 'flex-row-reverse' : ''}`}>
           <span className="font-semibold text-slate-700 dark:text-slate-200">
             {displayName}
           </span>
           <span className="text-slate-400 dark:text-slate-500">
             {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
           </span>
        </div>

        <div className={`relative transition-all duration-200 ${
          isUser
            ? 'bg-primary-600 text-white rounded-2xl rounded-tr-sm px-5 py-3 shadow-lg shadow-primary-500/10'
            : 'text-slate-800 dark:text-slate-200 px-1 py-1' 
        } ${isEditing ? 'w-full' : ''}`}>
          
          {/* Execution Trace (Logs) - Only for Model */}
          {!isUser && message.logs && message.logs.length > 0 && (
            <div className="w-full max-w-full overflow-hidden mb-2">
               <ExecutionTrace logs={message.logs} isStreaming={message.isStreaming} />
            </div>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && !isEditing && (
            <div className={`flex gap-2 mb-3 overflow-x-auto pb-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {message.attachments.map((att, idx) => (
                <div key={idx} className="relative shrink-0">
                  {att.mimeType.startsWith('image/') ? (
                    <img 
                      src={`data:${att.mimeType};base64,${att.data}`} 
                      alt="attachment" 
                      className="h-40 w-auto rounded-xl object-cover shadow-md border border-slate-200/10"
                    />
                  ) : (
                     <div className="h-24 w-20 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm">
                       <Icon name="File" className="text-slate-400" />
                     </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {isEditing ? (
            <div className={`min-w-[300px] p-4 rounded-2xl ${isUser ? 'bg-primary-700/50' : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800'}`}>
              <textarea
                ref={textareaRef}
                value={editText}
                onChange={(e) => {
                  setEditText(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onKeyDown={handleKeyDown}
                className={`w-full bg-transparent border-none outline-none resize-none text-sm leading-relaxed p-0 focus:ring-0 ${
                  isUser ? 'text-white placeholder-white/50' : 'text-slate-900 dark:text-slate-100'
                }`}
                rows={2}
              />
              <div className={`flex justify-end gap-2 mt-3 pt-2 border-t ${
                isUser ? 'border-white/20' : 'border-slate-200 dark:border-slate-800'
              }`}>
                <button 
                  onClick={handleCancelEdit}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    isUser 
                      ? 'text-white/80 hover:bg-white/10 hover:text-white' 
                      : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={handleSaveEdit}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg shadow-sm transition-all flex items-center gap-1 ${
                    isUser 
                      ? 'bg-white text-primary-600 hover:bg-primary-50' 
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  <Icon name="Check" size={12} />
                  {t.save}
                </button>
              </div>
            </div>
          ) : (
            <div className={`prose prose-slate dark:prose-invert max-w-none text-[15px] leading-7 ${
              isUser ? 'prose-p:text-white prose-headings:text-white prose-code:text-white prose-strong:text-white prose-a:text-white prose-blockquote:border-white/50' : 'prose-a:text-primary-600 dark:prose-a:text-primary-400 prose-headings:text-primary-700 dark:prose-headings:text-primary-300'
            }`}>
              {contentParts.map((part, index) => {
                if (part.type === 'widget') {
                  return <WidgetRenderer key={index} type={part.content.type} props={part.content.props} onInteract={onInteract} />;
                }
                return (
                  <ReactMarkdown 
                     key={index}
                     components={{
                       p({children}) {
                         return <p className="mb-4 last:mb-0">{children}</p>
                       },
                       a({node, ...props}) {
                         return <a target="_blank" rel="noopener noreferrer" className={`hover:underline font-medium transition-colors ${isUser ? 'text-white underline decoration-white/30' : 'text-primary-600 dark:text-primary-400 decoration-primary-300 dark:decoration-primary-700'}`} {...props} />
                       },
                       h1({children}) {
                          return <h1 className={`text-2xl font-bold mb-4 ${!isUser && 'text-primary-700 dark:text-primary-300'}`}>{children}</h1>
                       },
                       h2({children}) {
                          return <h2 className={`text-xl font-bold mb-3 mt-6 ${!isUser && 'text-primary-700 dark:text-primary-300'}`}>{children}</h2>
                       },
                       h3({children}) {
                          return <h3 className={`text-lg font-bold mb-2 mt-4 ${!isUser && 'text-primary-600 dark:text-primary-400'}`}>{children}</h3>
                       },
                       blockquote({children}) {
                          return <blockquote className={`border-l-4 pl-4 italic my-4 ${isUser ? 'border-white/40' : 'border-primary-500/40 text-slate-600 dark:text-slate-400'}`}>{children}</blockquote>
                       },
                       code({node, inline, className, children, ...props}: any) {
                         const match = /language-(\w+)/.exec(className || '')
                         return !inline ? (
                           <div className="rounded-xl overflow-hidden my-4 border border-slate-200 dark:border-slate-800 shadow-md bg-[#0d1117] dark:bg-[#0d1117]">
                             {/* Mac-style window header */}
                             <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-slate-800">
                               <div className="flex gap-1.5">
                                 <div className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/80 transition-colors"></div>
                                 <div className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ffbd2e]/80 transition-colors"></div>
                                 <div className="w-3 h-3 rounded-full bg-[#27c93f] hover:bg-[#27c93f]/80 transition-colors"></div>
                               </div>
                               <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                                 {match ? match[1] : 'code'}
                               </span>
                               <button 
                                 onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
                                 className="text-slate-500 hover:text-primary-400 transition-colors flex items-center gap-1 text-[10px]"
                                 title="Copy code"
                               >
                                 <Icon name="Copy" size={12} />
                                 <span className="hidden sm:inline">Copy</span>
                               </button>
                             </div>
                             <div className="p-4 overflow-x-auto">
                               <code className="!font-mono text-sm text-[#e6edf3]" {...props}>
                                 {children}
                               </code>
                             </div>
                           </div>
                         ) : (
                           <code className={`px-1.5 py-0.5 rounded font-mono text-[13px] border ${
                             isUser 
                              ? 'bg-white/20 text-white border-transparent' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                           }`} {...props}>
                             {children}
                           </code>
                         )
                       },
                       table({children}) {
                         return <div className="overflow-x-auto my-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"><table className="w-full text-sm text-left">{children}</table></div>
                       },
                       thead({children}) {
                          return <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 uppercase font-semibold text-xs">{children}</thead>
                       },
                       th({children}) {
                          return <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">{children}</th>
                       },
                       td({children}) {
                          return <td className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">{children}</td>
                       }
                     }}
                  >
                    {part.content}
                  </ReactMarkdown>
                );
              })}
              {message.isStreaming && message.role === Role.MODEL && (
                 <span className="inline-block w-2 h-4 align-middle ml-1 bg-primary-500 animate-pulse rounded-sm shadow-[0_0_10px_theme('colors.primary.500')]"></span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons - Cleaner looking */}
        <div className={`flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
           isEditing ? 'hidden' : ''
        } ${isUser ? 'pr-1' : 'pl-1'}`}>
          {isUser ? (
            <>
             <Tooltip content={t.edit}>
               <button 
                 onClick={() => setIsEditing(true)}
                 className="p-1.5 text-slate-400 hover:text-primary-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
               >
                 <Icon name="Pencil" size={14} />
               </button>
             </Tooltip>
             <Tooltip content={t.delete}>
               <button 
                 onClick={onDelete}
                 className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
               >
                 <Icon name="Trash2" size={14} />
               </button>
             </Tooltip>
            </>
          ) : (
             !message.isStreaming && (
               <div className="flex gap-0.5 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-0.5 shadow-sm">
                 <Tooltip content={t.goodResponse}>
                    <button 
                       onClick={() => onFeedback?.('up')}
                       className={`p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                         message.feedback === 'up' ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'text-slate-400 hover:text-emerald-500'
                       }`}
                    >
                       <Icon name="ThumbsUp" size={14} />
                    </button>
                 </Tooltip>
                 <Tooltip content={t.badResponse}>
                    <button 
                       onClick={() => onFeedback?.('down')}
                       className={`p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                         message.feedback === 'down' ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-slate-400 hover:text-red-500'
                       }`}
                    >
                       <Icon name="ThumbsDown" size={14} />
                    </button>
                 </Tooltip>
                 <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1 self-center"></div>
                 <Tooltip content={t.copy}>
                    <button 
                       onClick={() => {
                         navigator.clipboard.writeText(message.text);
                       }}
                       className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                       <Icon name="Copy" size={14} />
                    </button>
                 </Tooltip>
                 <Tooltip content={t.delete}>
                    <button 
                       onClick={onDelete}
                       className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                       <Icon name="Trash2" size={14} />
                    </button>
                 </Tooltip>
               </div>
             )
          )}
        </div>
      </div>
    </div>
  );
};

export const MessageBubble = React.memo(MessageBubbleBase, (prev, next) => {
  return (
    prev.message.id === next.message.id &&
    prev.message.text === next.message.text &&
    prev.message.isStreaming === next.message.isStreaming &&
    prev.message.feedback === next.message.feedback &&
    prev.message.role === next.message.role &&
    prev.isLast === next.isLast &&
    prev.language === next.language &&
    prev.userProfile.name === next.userProfile.name &&
    prev.userProfile.avatar === next.userProfile.avatar &&
    prev.message.logs?.length === next.message.logs?.length
  );
});
