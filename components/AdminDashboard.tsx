








import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { translations, Language } from '../translations';
import { KnowledgeBase } from './KnowledgeBase';
import { useAgents } from '../hooks/useAgents';
import { AgentConfig, KnowledgeBaseItem, KnowledgeDocument, ChunkingStrategy, Message, Role, Session, LogEntry } from '../types';
import { EvaluationDashboard } from './EvaluationDashboard';
import { ChatInput } from './ChatInput';
import { MessageBubble } from './MessageBubble';
import { streamGeminiResponse } from '../services/geminiService';
import { Drawer } from './Drawer';
import { Select } from './Select';

interface AdminDashboardProps {
  onBack: () => void;
  language: Language;
  onToggleLanguage: () => void;
  onToggleTheme: () => void;
  themeIcon: string;
  themeTitle: string;
  
  // Knowledge Props
  knowledgeBases: KnowledgeBaseItem[];
  createKnowledgeBase: (name: string, desc: string) => string;
  updateKnowledgeBase: (id: string, name: string, desc: string) => void;
  deleteKnowledgeBase: (id: string) => void;
  documents: KnowledgeDocument[];
  uploadDocument: (baseId: string, file: File) => void;
  deleteDocument: (id: string) => void;
  getStorageUsage: () => number;
  updateDocumentStrategy: (id: string, strategy: ChunkingStrategy) => void;
  startProcessing: (id: string) => void;
  batchDeleteDocuments: (ids: string[]) => void;
  batchUpdateStrategy: (ids: string[], strategy: ChunkingStrategy) => void;
  batchStartProcessing: (ids: string[]) => void;
}

type AgentCategory = 'supervisors' | 'agents' | 'workflows';

// --- LOG VIEWER COMPONENT (Legacy/Side-drawer version) ---
const LogViewer: React.FC<{ logs: LogEntry[] }> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
        <Icon name="Activity" size={32} className="mb-2" />
        <p className="text-xs">No execution logs yet.</p>
        <p className="text-[10px]">Run a test to see internal steps.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0F172A] text-slate-300 font-mono text-xs overflow-hidden">
      <div className="p-2 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
        <span className="font-bold text-slate-100 flex items-center gap-2">
          <Icon name="Terminal" size={14} />
          Execution Stream
        </span>
        <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{logs.length} events</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-4">
        {logs.map((log) => (
          <div key={log.id} className="relative pl-4 border-l border-slate-700 animate-in fade-in slide-in-from-left-2 duration-200">
             <div className={`absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full border-2 border-[#0F172A] ${
               log.type === 'error' ? 'bg-red-500' :
               log.type === 'success' ? 'bg-emerald-500' :
               log.type === 'tool' ? 'bg-amber-500' :
               log.type === 'rag' ? 'bg-blue-500' :
               'bg-slate-500'
             }`}></div>
             
             <div className="flex items-center gap-2 mb-1">
               <span className={`font-bold ${
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'success' ? 'text-emerald-400' :
                  log.type === 'tool' ? 'text-amber-400' :
                  log.type === 'rag' ? 'text-blue-400' :
                  'text-slate-100'
               }`}>
                 {log.title}
               </span>
               <span className="text-[10px] text-slate-500 ml-auto">
                 {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}.{new Date(log.timestamp).getMilliseconds().toString().padStart(3, '0')}
               </span>
             </div>
             
             {log.agentName && (
               <div className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
                 <Icon name="Bot" size={10} />
                 {log.agentName}
               </div>
             )}

             {log.details && (
               <div className="bg-slate-800/50 p-2 rounded overflow-x-auto border border-slate-700/50 mt-1">
                 {typeof log.details === 'string' ? (
                   <span className="whitespace-pre-wrap">{log.details}</span>
                 ) : (
                   <pre className="text-[10px] text-slate-400 leading-tight">
                     {JSON.stringify(log.details, null, 2)}
                   </pre>
                 )}
               </div>
             )}
          </div>
        ))}
      </div>
    </div>
  );
};


export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onBack, 
  language,
  onToggleLanguage,
  onToggleTheme,
  themeIcon,
  themeTitle,
  knowledgeBases,
  createKnowledgeBase,
  updateKnowledgeBase,
  deleteKnowledgeBase,
  documents,
  uploadDocument,
  deleteDocument,
  getStorageUsage,
  updateDocumentStrategy,
  startProcessing,
  batchDeleteDocuments,
  batchUpdateStrategy,
  batchStartProcessing
}) => {
  const [activeTab, setActiveTab] = useState<'agents' | 'rag' | 'eval'>('agents');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [category, setCategory] = useState<AgentCategory>('agents');
  const t = translations[language];
  
  const { agents } = useAgents();

  // Playground State with Multi-session support
  const [playSessions, setPlaySessions] = useState<Session[]>([]);
  const [currentPlaySessionId, setCurrentPlaySessionId] = useState<string | null>(null);
  const [isPlayStreaming, setIsPlayStreaming] = useState(false);
  const [rightPanelMode, setRightPanelMode] = useState<'config' | 'history' | 'logs' | 'none'>('none');
  const [executionLogs, setExecutionLogs] = useState<LogEntry[]>([]); // Global logs for side drawer

  // Filter agents
  const supervisors = agents.filter(a => a.type === 'supervisor');
  const standardAgents = agents.filter(a => a.type !== 'supervisor');

  // Select default agent if none
  useEffect(() => {
    if (!selectedAgentId && agents.length > 0) {
      // Default to first agent
      const firstAgent = agents[0];
      setSelectedAgentId(firstAgent.id);
      setCategory(firstAgent.type === 'supervisor' ? 'supervisors' : 'agents');
    }
  }, [agents, selectedAgentId]);

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  // Derive current list based on category
  const currentList = category === 'supervisors' ? supervisors : (category === 'agents' ? standardAgents : []);

  // Filter sessions for current agent
  const agentSessions = playSessions
    .filter(s => s.agentId === selectedAgentId)
    .sort((a, b) => b.lastModified - a.lastModified);

  // Get active session
  const activePlaySession = agentSessions.find(s => s.id === currentPlaySessionId) || agentSessions[0];
  const playMessages = activePlaySession?.messages || [];

  // Ensure we have a session if agent is selected
  useEffect(() => {
    if (selectedAgentId) {
       // Check if we need to initialize a session for this agent
       const hasSession = playSessions.some(s => s.agentId === selectedAgentId);
       if (!hasSession) {
          const newId = Date.now().toString();
          const newSession: Session = {
             id: newId,
             title: 'Debug Session 1',
             messages: [],
             agentId: selectedAgentId,
             lastModified: Date.now()
          };
          setPlaySessions(prev => [newSession, ...prev]);
          setCurrentPlaySessionId(newId);
       } else if (!currentPlaySessionId || !playSessions.find(s => s.id === currentPlaySessionId && s.agentId === selectedAgentId)) {
          // Switch to first available if current is invalid for this agent
          const firstForAgent = playSessions.find(s => s.agentId === selectedAgentId);
          if (firstForAgent) setCurrentPlaySessionId(firstForAgent.id);
       }
    }
  }, [selectedAgentId, playSessions.length]); // Depend on length to detect deletions/initial load

  const handleCategoryChange = (newCat: string) => {
    const cat = newCat as AgentCategory;
    setCategory(cat);
    
    // Select first item of new item list
    let newList: AgentConfig[] = [];
    if (cat === 'supervisors') newList = supervisors;
    else if (cat === 'agents') newList = standardAgents;
    
    if (newList.length > 0) {
      setSelectedAgentId(newList[0].id);
    } else {
      setSelectedAgentId(null);
    }
  };

  const handleNewSession = () => {
    if (!selectedAgentId) return;
    const newId = Date.now().toString();
    const newSession: Session = {
        id: newId,
        title: `Debug Session ${agentSessions.length + 1}`,
        messages: [],
        agentId: selectedAgentId,
        lastModified: Date.now()
    };
    setPlaySessions(prev => [newSession, ...prev]);
    setCurrentPlaySessionId(newId);
    setExecutionLogs([]); // Clear logs for new session
  };

  const handlePlaygroundSend = async (text: string, attachments: any[]) => {
    if (!selectedAgent || !activePlaySession) return;
    
    const sessionId = activePlaySession.id;

    // Determine new title if this is the first message
    let newTitle = activePlaySession.title;
    if (activePlaySession.messages.length === 0) {
      newTitle = text.slice(0, 30) + (text.length > 30 ? '...' : '');
    }

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text,
      attachments,
      timestamp: Date.now()
    };
    
    // Update State Optimistically
    const newHistory = [...activePlaySession.messages, newUserMsg];
    
    setPlaySessions(prev => prev.map(s => 
      s.id === sessionId 
      ? { ...s, messages: newHistory, title: newTitle, lastModified: Date.now() } 
      : s
    ));
    
    setIsPlayStreaming(true);
    setExecutionLogs([]); // Clear previous run logs
    
    const botMsgId = (Date.now() + 1).toString();
    const placeholderMsg: Message = {
      id: botMsgId,
      role: Role.MODEL,
      text: '',
      timestamp: Date.now(),
      isStreaming: true,
      agentName: language === 'zh' ? selectedAgent.name_zh : selectedAgent.name,
      logs: [] // Initialize empty logs
    };
    
    setPlaySessions(prev => prev.map(s => 
      s.id === sessionId 
      ? { ...s, messages: [...newHistory, placeholderMsg] } 
      : s
    ));

    await streamGeminiResponse(
      selectedAgent,
      [...newHistory, newUserMsg], // Pass full history including user msg
      text,
      attachments,
      (chunk) => {
        setPlaySessions(prev => prev.map(s => {
          if (s.id === sessionId) {
              const msgs = s.messages.map(m => m.id === botMsgId ? { ...m, text: chunk } : m);
              return { ...s, messages: msgs };
          }
          return s;
        }));
      },
      (full) => {
        setPlaySessions(prev => prev.map(s => {
          if (s.id === sessionId) {
              const msgs = s.messages.map(m => m.id === botMsgId ? { ...m, text: full, isStreaming: false } : m);
              return { ...s, messages: msgs, lastModified: Date.now() };
          }
          return s;
        }));
        setIsPlayStreaming(false);
      },
      () => setIsPlayStreaming(false),
      agents,
      documents, // Pass documents for RAG simulation
      (log) => { // Handle Log
         setExecutionLogs(prev => [...prev, log]); // Update side drawer
         
         // Update Message logs in real-time
         setPlaySessions(prev => prev.map(s => {
            if (s.id === sessionId) {
               const msgs = s.messages.map(m => 
                 m.id === botMsgId 
                 ? { ...m, logs: [...(m.logs || []), log] } 
                 : m
               );
               return { ...s, messages: msgs };
            }
            return s;
         }));
      }
    );
  };

  const deleteSession = (sessionId: string) => {
     const newSessions = playSessions.filter(s => s.id !== sessionId);
     setPlaySessions(newSessions);
     if (currentPlaySessionId === sessionId) {
        // Switch to another one or create new if empty?
        const remaining = newSessions.filter(s => s.agentId === selectedAgentId);
        if (remaining.length > 0) {
           setCurrentPlaySessionId(remaining[0].id);
        } else {
           // Effect will handle creation
           setCurrentPlaySessionId(null); 
        }
     }
  };

  const NavItem = ({ id, icon, label }: { id: 'agents' | 'rag' | 'eval', icon: string, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`relative flex items-center justify-center lg:justify-start gap-3 px-3 lg:px-4 py-2.5 lg:py-3.5 rounded-xl lg:rounded-2xl transition-all duration-300 group ${
        activeTab === id 
          ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' 
          : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
      }`}
      title={label}
    >
      <Icon name={icon} size={20} className={`transition-transform group-hover:scale-110 ${activeTab === id ? '' : 'opacity-70'}`} />
      <span className="font-medium tracking-wide hidden lg:block">{label}</span>
      {activeTab === id && <span className="absolute right-3 hidden lg:block"><Icon name="ChevronRight" size={14} className="opacity-50" /></span>}
    </button>
  );

  const WIDGET_TEMPLATES = [
    {
      label: 'Analysis',
      icon: 'BarChart',
      code: `:::widget
{
  "type": "analysis-card",
  "props": {
    "title": "Performance Metrics",
    "value": "98.5%",
    "trend": "up",
    "trendValue": "+2.4%",
    "description": "System operating at optimal efficiency."
  }
}
:::`
    },
    {
      label: 'Process',
      icon: 'ListOrdered',
      code: `:::widget
{
  "type": "step-process",
  "props": {
    "title": "Installation Guide",
    "steps": [
      { "label": "Download Package", "status": "completed" },
      { "label": "Configure Settings", "status": "current" },
      { "label": "Launch Application", "status": "pending" }
    ]
  }
}
:::`
    },
    {
      label: 'Alert',
      icon: 'AlertTriangle',
      code: `:::widget
{
  "type": "status-alert",
  "props": {
    "type": "success",
    "message": "Operation completed successfully."
  }
}
:::`
    },
    {
      label: 'Input Form',
      icon: 'FormInput',
      code: `:::widget
{
  "type": "input-form",
  "props": {
    "id": "feedback-form",
    "title": "User Feedback",
    "submitLabel": "Send Feedback",
    "fields": [
      { "name": "email", "label": "Email", "type": "email", "required": true },
      { "name": "category", "label": "Category", "type": "select", "options": ["Bug", "Feature", "Other"] },
      { "name": "details", "label": "Details", "type": "textarea", "placeholder": "Describe your feedback..." }
    ]
  }
}
:::`
    },
    {
      label: 'Selector',
      icon: 'MousePointerClick',
      code: `:::widget
{
  "type": "option-selector",
  "props": {
    "id": "deployment-choice",
    "title": "Select Deployment Environment",
    "options": [
      { "label": "Development", "value": "Deploy to Dev", "description": "Local sandbox environment" },
      { "label": "Staging", "value": "Deploy to Staging", "description": "Pre-production environment" },
      { "label": "Production", "value": "Deploy to Prod", "description": "Live user-facing environment" }
    ]
  }
}
:::`
    }
  ];

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-50 dark:bg-slate-950 bg-texture transition-colors duration-500">
      {/* Ambient Background Blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-primary-400/10 dark:bg-primary-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-violet-400/10 dark:bg-violet-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Main Glass Container */}
      <div className="relative z-10 flex flex-col md:flex-row h-full w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-2xl border border-white/40 dark:border-white/5 overflow-hidden ring-1 ring-black/5 rounded-none md:rounded-2xl md:my-4 md:mx-4 md:h-[calc(100%-2rem)] md:w-[calc(100%-2rem)] max-w-screen-2xl mx-auto">
        
        {/* Main Sidebar (Modules) */}
        <div className="w-full md:w-20 lg:w-64 border-b md:border-b-0 md:border-r border-slate-200/50 dark:border-slate-800/50 flex flex-row md:flex-col flex-shrink-0 bg-white/30 dark:bg-slate-900/30 h-auto md:h-full z-20">
          
          {/* Header */}
          <div className="p-4 lg:p-6 flex items-center md:flex-col md:items-center lg:items-start gap-3">
             <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 dark:from-white dark:to-slate-200 flex items-center justify-center text-white dark:text-slate-900 shadow-lg shrink-0">
               <Icon name="Shield" size={16} />
             </div>
             <div className="flex flex-col">
               <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white block md:hidden lg:block">{t.adminPanel}</span>
               <span className="text-[9px] text-slate-400 font-medium uppercase tracking-widest hidden lg:block">Workspace OS</span>
             </div>
          </div>
          
          {/* Nav Items */}
          <div className="flex-1 px-2 lg:px-4 flex md:flex-col items-center md:items-stretch gap-1 md:gap-2 overflow-x-auto md:overflow-visible no-scrollbar py-2 md:py-0">
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 mb-2 hidden lg:block">Modules</div>
             <NavItem id="agents" icon="Bot" label={t.agentManagement} />
             <NavItem id="rag" icon="Database" label={t.ragKnowledge} />
             <NavItem id="eval" icon="FlaskConical" label={t.evalLab} />
          </div>

          {/* Footer Controls */}
          <div className="p-2 lg:p-6 md:space-y-3 border-l md:border-l-0 md:border-t border-slate-200/50 dark:border-slate-800/50 bg-white/20 dark:bg-black/20 backdrop-blur-sm flex md:flex-col items-center justify-center lg:justify-start gap-2">
            <div className="flex items-center gap-2">
              <button onClick={onToggleTheme} className="flex items-center justify-center w-8 h-8 lg:w-auto lg:h-auto lg:p-3 rounded-lg lg:rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary-500 dark:hover:text-primary-400 transition-all shadow-sm">
                 <Icon name={themeIcon} size={16} />
              </button>
              <button onClick={onToggleLanguage} className="flex items-center justify-center w-8 h-8 lg:w-auto lg:h-auto lg:p-3 rounded-lg lg:rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary-500 dark:hover:text-primary-400 transition-all shadow-sm font-bold text-xs">
                 {language === 'zh' ? 'EN' : '中'}
              </button>
            </div>
            <button onClick={onBack} className="md:w-full flex items-center justify-center gap-2 p-2 lg:px-4 lg:py-3 rounded-lg lg:rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-md hover:shadow-lg group">
              <Icon name="ArrowLeft" size={16} className="lg:group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-bold hidden lg:inline">{t.backToChat}</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {activeTab === 'agents' && (
             <div className="flex h-full w-full relative">
                
                {/* Center Chat Area */}
                <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900/20 relative min-w-0">
                   {/* Header with Breadcrumb Navigation */}
                   <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 sm:px-6 shrink-0 z-10">
                      <div className="flex items-center gap-2">
                         <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800 ${
                            category === 'supervisors' ? 'bg-violet-50 text-violet-600' : 
                            category === 'agents' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'
                         }`}>
                            <Icon name={category === 'supervisors' ? 'Users' : (category === 'workflows' ? 'GitMerge' : 'Bot')} size={18} />
                         </div>
                         
                         <div className="flex items-center">
                            <Select 
                               variant="ghost"
                               value={category}
                               options={[
                                  { value: 'supervisors', label: 'Supervisors' },
                                  { value: 'agents', label: 'Agents' },
                                  { value: 'workflows', label: 'Workflows' }
                               ]}
                               onChange={handleCategoryChange}
                            />
                            <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                            <Select 
                               variant="ghost"
                               value={selectedAgentId || ''}
                               options={currentList.map(a => ({ 
                                  value: a.id, 
                                  label: language === 'zh' ? a.name_zh : a.name,
                                  icon: a.icon
                               }))}
                               onChange={setSelectedAgentId}
                               placeholder={currentList.length === 0 ? "No items" : "Select Agent"}
                               disabled={currentList.length === 0}
                            />
                            {/* Session Breadcrumb */}
                            {activePlaySession && (
                              <>
                                <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                                <Select 
                                    variant="ghost"
                                    value={activePlaySession.id}
                                    options={agentSessions.map(s => ({
                                        value: s.id,
                                        label: s.title || 'Untitled Session',
                                        description: new Date(s.lastModified).toLocaleTimeString()
                                    }))}
                                    onChange={(val) => setCurrentPlaySessionId(val)}
                                    placeholder="Select Session"
                                />
                              </>
                            )}
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                         <button 
                           onClick={() => setRightPanelMode(prev => prev === 'config' ? 'none' : 'config')}
                           className={`p-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
                             rightPanelMode === 'config' 
                               ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-inner' 
                               : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                           }`}
                           title="Configuration"
                         >
                            <Icon name="Settings" size={16} />
                         </button>
                         <button 
                           onClick={() => setRightPanelMode(prev => prev === 'history' ? 'none' : 'history')}
                           className={`p-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
                             rightPanelMode === 'history' 
                               ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-inner' 
                               : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                           }`}
                           title="Debug History"
                         >
                            <Icon name="History" size={16} />
                         </button>
                         <button 
                           onClick={() => setRightPanelMode(prev => prev === 'logs' ? 'none' : 'logs')}
                           className={`p-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
                             rightPanelMode === 'logs' 
                               ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-inner' 
                               : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                           }`}
                           title="Live Execution Logs"
                         >
                            <Icon name="Activity" size={16} />
                         </button>
                         <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                         <button 
                           onClick={handleNewSession}
                           className="p-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                           title="New Session"
                         >
                            <Icon name="Plus" size={16} />
                         </button>
                      </div>
                   </div>

                   {/* Chat Messages */}
                   <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                      {selectedAgent ? (
                         playMessages.length === 0 ? (
                           <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 pb-10">
                              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 shadow-inner`}>
                                 <Icon name={selectedAgent.icon} size={40} className="text-slate-400 dark:text-slate-500" />
                              </div>
                              <p className="text-base font-medium text-slate-600 dark:text-slate-300">Start debugging {language === 'zh' ? selectedAgent.name_zh : selectedAgent.name}</p>
                              <p className="text-sm mt-1">Type a message below to test the agent's logic.</p>
                           </div>
                         ) : (
                           playMessages.map((msg, idx) => (
                              <MessageBubble 
                                 key={msg.id} 
                                 message={msg} 
                                 isLast={idx === playMessages.length - 1}
                                 language={language}
                                 userProfile={{ name: 'Admin', avatar: '' }}
                              />
                           ))
                         )
                      ) : (
                         <div className="h-full flex items-center justify-center text-slate-400">
                            Select an agent to start.
                         </div>
                      )}
                   </div>

                   {/* Chat Input & Widget Shortcuts */}
                   <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
                      <div className="max-w-4xl mx-auto">
                         {/* Widget Templates Shortcuts */}
                         <div className="flex items-center gap-2 mb-3 overflow-x-auto no-scrollbar">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Insert:</span>
                           {WIDGET_TEMPLATES.map((tmpl, i) => (
                             <button 
                               key={i}
                               onClick={() => handlePlaygroundSend(tmpl.code, [])}
                               className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
                             >
                               <Icon name={tmpl.icon} size={12} />
                               {tmpl.label}
                             </button>
                           ))}
                         </div>

                         <ChatInput 
                           onSendMessage={handlePlaygroundSend}
                           isStreaming={isPlayStreaming}
                           language={language}
                         />
                      </div>
                   </div>
                   
                   {/* 3. Right Panel (Floating Drawers) */}
                   <Drawer 
                     isOpen={rightPanelMode === 'config'} 
                     onClose={() => setRightPanelMode('none')} 
                     title="Configuration" 
                     icon="Settings"
                   >
                       {selectedAgent && (
                          <div className="space-y-6">
                             <div className="flex justify-between items-center">
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500 font-normal border border-slate-200 dark:border-slate-700">Read Only View</span>
                             </div>
                             
                             <div>
                                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Agent Name</label>
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100 p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                                   {language === 'zh' ? selectedAgent.name_zh : selectedAgent.name}
                                </div>
                             </div>
                             
                             <div>
                                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Description</label>
                                <div className="text-sm text-slate-600 dark:text-slate-400 p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                                   {language === 'zh' ? selectedAgent.description_zh : selectedAgent.description}
                                </div>
                             </div>
                             
                             <div className="grid grid-cols-2 gap-3">
                                <div>
                                   <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Model</label>
                                   <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 truncate">
                                      <Icon name="Box" size={12} />
                                      <span className="truncate">{selectedAgent.model}</span>
                                   </div>
                                </div>
                                <div>
                                   <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Type</label>
                                   <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                                      <Icon name={selectedAgent.type === 'supervisor' ? 'Users' : 'Bot'} size={12} />
                                      <span className="capitalize">{selectedAgent.type || 'Agent'}</span>
                                   </div>
                                </div>
                             </div>

                             {selectedAgent.type === 'supervisor' && selectedAgent.subAgentIds && (
                                <div>
                                   <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Sub Agents</label>
                                   <div className="flex flex-wrap gap-2">
                                      {selectedAgent.subAgentIds.map(subId => {
                                         const sub = agents.find(a => a.id === subId);
                                         return (
                                            <span key={subId} className="text-xs px-2 py-1 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300 rounded border border-violet-100 dark:border-violet-800 flex items-center gap-1">
                                               <Icon name={sub?.icon || 'Bot'} size={10} />
                                               {sub ? (language === 'zh' ? sub.name_zh : sub.name) : subId}
                                            </span>
                                         );
                                      })}
                                   </div>
                                </div>
                             )}
                             
                             <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
                             
                             <div>
                                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">System Instruction</label>
                                <div className="w-full p-3 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-mono text-[11px] rounded-lg border border-slate-200 dark:border-slate-800 h-64 overflow-y-auto whitespace-pre-wrap custom-scrollbar">
                                   {selectedAgent.systemInstruction}
                                </div>
                             </div>
                          </div>
                       )}
                   </Drawer>

                   <Drawer 
                     isOpen={rightPanelMode === 'history'} 
                     onClose={() => setRightPanelMode('none')} 
                     title="Debug Sessions" 
                     icon="History"
                   >
                      <div className="space-y-4">
                         <div className="p-3 mb-2 rounded-xl bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30">
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                               Current Session
                            </div>
                            <div className="text-[10px] text-slate-500">{new Date().toLocaleString()}</div>
                            <div className="text-[10px] text-slate-400 mt-1">{playMessages.length} messages</div>
                         </div>

                         <div className="space-y-2">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1 mb-2">History</h4>
                            {agentSessions.map(session => (
                               <div 
                                  key={session.id}
                                  onClick={() => setCurrentPlaySessionId(session.id)}
                                  className={`p-3 rounded-lg cursor-pointer transition-all border ${
                                    session.id === currentPlaySessionId
                                    ? 'bg-white dark:bg-slate-800 border-primary-500 ring-1 ring-primary-500 shadow-sm'
                                    : 'bg-transparent border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                                  }`}
                               >
                                  <div className="flex justify-between items-start mb-1">
                                    <div className={`font-medium text-xs ${session.id === currentPlaySessionId ? 'text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-300'} truncate flex-1 pr-2`}>
                                       {session.title || 'Untitled Session'}
                                    </div>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                                      className="text-slate-400 hover:text-red-500"
                                    >
                                      <Icon name="Trash2" size={12} />
                                    </button>
                                  </div>
                                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                                    <span>{new Date(session.lastModified).toLocaleTimeString()}</span>
                                    <span>{session.messages.length} msgs</span>
                                  </div>
                               </div>
                            ))}
                            {agentSessions.length === 0 && (
                               <div className="text-center py-4 text-xs text-slate-400 italic">No history available</div>
                            )}
                         </div>
                         
                         <button 
                           onClick={handleNewSession}
                           className="w-full py-2 flex items-center justify-center gap-2 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                         >
                           <Icon name="Plus" size={14} />
                           Create New Session
                         </button>
                      </div>
                   </Drawer>

                   <Drawer
                      isOpen={rightPanelMode === 'logs'}
                      onClose={() => setRightPanelMode('none')}
                      title="Live Execution"
                      icon="Activity"
                      width="w-96"
                   >
                      <LogViewer logs={executionLogs} />
                   </Drawer>

                </div>
             </div>
          )}

          {activeTab === 'rag' && (
            <KnowledgeBase 
              knowledgeBases={knowledgeBases}
              onCreateBase={createKnowledgeBase}
              onUpdateBase={updateKnowledgeBase}
              onDeleteBase={deleteKnowledgeBase}
              documents={documents}
              onUpload={uploadDocument}
              onDeleteDoc={deleteDocument}
              onUpdateStrategy={updateDocumentStrategy}
              onStartProcessing={startProcessing}
              onBatchDelete={batchDeleteDocuments}
              onBatchUpdateStrategy={batchUpdateStrategy}
              onBatchStartProcessing={batchStartProcessing}
              storageUsed={getStorageUsage()}
              language={language}
            />
          )}

          {activeTab === 'eval' && (
            <EvaluationDashboard agents={agents} language={language} />
          )}
        </div>
      </div>
    </div>
  );
};