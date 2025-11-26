
import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { Role, ThemeColor, AgentConfig, Message } from '../types';
import { AgentSelector } from './AgentSelector';
import { ChatInput } from './ChatInput';
import { MessageBubble } from './MessageBubble';
import { SessionList } from './SessionList';
import { ConfirmationModal } from './ConfirmationModal';
import { UserMenu } from './UserMenu';
import { UserSettingsModal } from './UserSettingsModal';
import { ApiKeyModal } from './ApiKeyModal';
import { Icon } from './Icon';
import { translations, Language } from '../translations';
import { Tooltip } from './Tooltip';
import { useTheme } from '../hooks/useTheme';
import { useUserProfile } from '../hooks/useUserProfile';
import { useChat } from '../hooks/useChat';
import { useAgents } from '../hooks/useAgents';
import { useKnowledge } from '../hooks/useKnowledge';

// Color palettes
const THEME_COLORS: Record<ThemeColor, Record<string, string>> = {
  blue: {
    50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa',
    500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a', 950: '#172554'
  },
  emerald: {
    50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399',
    500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b', 950: '#022c22'
  },
  violet: {
    50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa',
    500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065'
  },
  amber: {
    50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24',
    500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f', 950: '#451a03'
  },
  rose: {
    50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185',
    500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337', 950: '#4c0519'
  }
};

const groupMessagesByDate = (messages: Message[]) => {
  const groups: { date: string; messages: Message[] }[] = [];
  messages.forEach(msg => {
    const date = new Date(msg.timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    let dateLabel = date.toLocaleDateString();
    
    if (date.toDateString() === today.toDateString()) {
      dateLabel = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateLabel = 'Yesterday';
    }

    let group = groups.find(g => g.date === dateLabel);
    if (!group) {
      group = { date: dateLabel, messages: [] };
      groups.push(group);
    }
    group.messages.push(msg);
  });
  return groups;
};

interface ChatPageProps {
  onLogout: () => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({ onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [language, setLanguage] = useState<Language>('zh');

  // Hooks
  const { agents } = useAgents();
  const { userProfile, saveUserProfile } = useUserProfile();
  const { documents } = useKnowledge();
  
  const {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    messages,
    isStreaming,
    activeAgent,
    setActiveAgent,
    modelId,
    setModelId,
    handleSendMessage,
    handleDeleteSession,
    handleNewChat
  } = useChat(language, userProfile, agents, documents);

  const { themeMode, toggleTheme, getThemeIcon, getThemeTitle } = useTheme(language);
  const t = translations[language];

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Apply Theme Colors
  useEffect(() => {
    const theme = THEME_COLORS[activeAgent?.themeColor || 'blue'];
    const root = document.documentElement;
    Object.entries(theme).forEach(([shade, color]) => {
      root.style.setProperty(`--color-primary-${shade}`, color as string);
    });
  }, [activeAgent]);

  // Scroll to bottom
  useLayoutEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isStreaming]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollBottom(!isNearBottom);
    }
  };

  const toggleLanguage = () => {
    const newLang = language === 'zh' ? 'en' : 'zh';
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-500">
      <UserSettingsModal
        isOpen={isUserModalOpen}
        userProfile={userProfile}
        onSave={saveUserProfile}
        onClose={() => setIsUserModalOpen(false)}
        language={language}
      />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onSave={(url, key) => {
            setIsApiKeyModalOpen(false);
            window.dispatchEvent(new CustomEvent('agno_settings_updated'));
        }}
        onClose={() => setIsApiKeyModalOpen(false)}
        language={language}
      />

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full opacity-0'} 
        transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) bg-slate-100/80 dark:bg-black/20 backdrop-blur-xl border-r border-white/20 dark:border-white/5 flex flex-col h-full fixed md:relative z-30 shadow-2xl md:shadow-none`}>
        
        <div className="p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 text-white transition-colors duration-300">
              <Icon name="Zap" size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-slate-900 dark:text-white leading-none">
                Agno<span className="text-primary-500 transition-colors duration-300">Chat</span>
              </h1>
              <span className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Agentic OS</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 hover:bg-black/5 rounded-lg"><Icon name="X" size={20} /></button>
        </div>

        <div className="flex-1 overflow-hidden px-2">
          <SessionList 
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelectSession={setCurrentSessionId}
            onDeleteSession={handleDeleteSession}
            onNewChat={handleNewChat}
            language={language}
          />
        </div>

        <div className="shrink-0 p-2 space-y-2">
          {activeAgent && (
            <AgentSelector 
                currentAgent={activeAgent} 
                onSelectAgent={setActiveAgent}
                language={language}
            />
          )}
          <UserMenu 
            userProfile={userProfile}
            onClick={() => setIsUserModalOpen(true)}
            onLogout={onLogout}
            language={language}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative w-full bg-texture transition-colors duration-300">
        <header className="h-16 absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-6 bg-gradient-to-b from-slate-50/90 to-slate-50/0 dark:from-slate-950/90 dark:to-slate-950/0 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-4">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-slate-500 hover:text-primary-600 transition-all">
                <Icon name="PanelLeft" size={20} />
              </button>
            )}
            {activeAgent && (
                <div className="flex items-center gap-3 backdrop-blur-md bg-white/50 dark:bg-black/50 px-3 py-1.5 rounded-full border border-white/20 dark:border-white/5 shadow-sm">
                    <Icon name={activeAgent.icon} className="text-primary-600 dark:text-primary-400" size={16} />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {language === 'zh' ? activeAgent.name_zh : activeAgent.name}
                    </span>
                </div>
            )}
          </div>

          <div className="pointer-events-auto flex items-center gap-2 backdrop-blur-md bg-white/50 dark:bg-black/50 p-1 rounded-2xl border border-white/20 dark:border-white/5 shadow-sm">
              <Tooltip content={t.apiKeyTitle}>
                 <button onClick={() => setIsApiKeyModalOpen(true)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-500">
                   <Icon name="Server" size={16} />
                 </button>
              </Tooltip>
              <Tooltip content={t.switchLanguage}>
                <button onClick={toggleLanguage} className="w-8 h-8 flex items-center justify-center text-[10px] font-bold rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50">
                  {language === 'zh' ? '中' : 'EN'}
                </button>
              </Tooltip>
              <Tooltip content={getThemeTitle()}>
                <button onClick={toggleTheme} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-500">
                  <Icon name={getThemeIcon()} size={16} />
                </button>
              </Tooltip>
          </div>
        </header>

        <main 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto scroll-smooth relative z-0 pt-24 pb-64 hover-scrollbar"
        >
          <div className="max-w-3xl mx-auto px-4">
            {messages.length === 0 && activeAgent ? (
              <div className="min-h-[60vh] flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-[2rem] flex items-center justify-center shadow-2xl mb-6">
                    <Icon name={activeAgent.icon} size={48} className="text-primary-600 dark:text-primary-400" />
                </div>
                <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                    {t.hello} <span className="text-primary-600 dark:text-primary-400">{language === 'zh' ? activeAgent.name_zh : activeAgent.name}</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-lg max-w-md mb-10">
                    {language === 'zh' ? activeAgent.description_zh : activeAgent.description}
                </p>
              </div>
            ) : (
                messageGroups.map((group) => (
                  <React.Fragment key={group.date}>
                    <div className="flex items-center justify-center py-6 opacity-60">
                      <div className="h-px w-12 bg-slate-200 dark:bg-slate-700"></div>
                      <span className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        {group.date}
                      </span>
                      <div className="h-px w-12 bg-slate-200 dark:bg-slate-700"></div>
                    </div>
                    {group.messages.map((msg, index) => (
                        <MessageBubble 
                          key={msg.id} 
                          message={msg} 
                          isLast={index === group.messages.length - 1}
                          language={language}
                          userProfile={userProfile}
                        />
                    ))}
                  </React.Fragment>
                ))
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </main>

        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent dark:from-slate-950 dark:via-slate-950/95 pt-20 pointer-events-none pb-8">
          <div className="pointer-events-auto">
            <ChatInput 
              onSendMessage={handleSendMessage} 
              isStreaming={isStreaming} 
              language={language} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};