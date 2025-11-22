
import React from 'react';
import { Session, AGENTS } from '../types';
import { Icon } from './Icon';
import { translations, Language } from '../translations';
import { Tooltip } from './Tooltip';

interface SessionListProps {
  sessions: Session[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onNewChat: () => void;
  language: Language;
}

export const SessionList: React.FC<SessionListProps> = ({ 
  sessions, 
  currentSessionId, 
  onSelectSession, 
  onDeleteSession,
  onNewChat,
  language
}) => {
  const t = translations[language];

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 pb-0">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all shadow-sm group"
        >
          <Icon name="Plus" size={18} />
          <span className="text-sm font-medium">{t.newChat}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-2 mt-2">
          {t.recentChats}
        </div>
        
        {sessions.length === 0 && (
          <div className="text-center py-8 px-4">
             <p className="text-xs text-slate-400">{t.noHistory}</p>
             <p className="text-xs text-slate-400">{t.startConversation}</p>
          </div>
        )}

        {sessions.map((session) => {
          const agent = AGENTS.find(a => a.id === session.agentId) || AGENTS[0];
          
          return (
            <div key={session.id} className="relative group">
              <button
                onClick={() => onSelectSession(session.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                  currentSessionId === session.id
                    ? 'bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                    : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className={`flex-shrink-0 ${currentSessionId === session.id ? agent.color : 'text-slate-400'}`}>
                  <Icon name={agent.icon} size={18} />
                </div>
                
                <div className="flex-1 min-w-0 pr-6">
                  <h3 className={`text-sm truncate ${
                    currentSessionId === session.id 
                      ? 'font-medium text-slate-900 dark:text-slate-100' 
                      : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {session.title || t.newChat}
                  </h3>
                  <p className="text-[10px] text-slate-400 truncate">
                    {new Date(session.lastModified).toLocaleDateString()} • {new Date(session.lastModified).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </button>

              <div className={`absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 ${
                 currentSessionId === session.id ? 'opacity-100' : ''
              }`}>
                <Tooltip content={t.delete} position="left">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="p-1.5 rounded-md text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"
                    aria-label="Delete conversation"
                  >
                    <Icon name="Trash2" size={16} />
                  </button>
                </Tooltip>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
