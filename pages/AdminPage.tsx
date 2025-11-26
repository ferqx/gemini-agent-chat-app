
import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { translations, Language } from '../translations';
import { KnowledgeBase } from '../components/KnowledgeBase';
import { KnowledgeBaseItem, KnowledgeDocument, ChunkingStrategy } from '../types';
import { EvaluationDashboard } from '../components/EvaluationDashboard';
import { AgentPlayground } from '../components/admin/AgentPlayground';
import { useAgents } from '../hooks/useAgents';

interface AdminPageProps {
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

export const AdminPage: React.FC<AdminPageProps> = ({ 
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
  const t = translations[language];
  const { agents } = useAgents();

  const NavItem = ({ id, icon, label }: { id: 'agents' | 'rag' | 'eval', icon: string, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`relative flex items-center justify-start gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
        activeTab === id 
          ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' 
          : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
      }`}
      title={label}
    >
      <Icon name={icon} size={20} className={`transition-transform group-hover:scale-110 ${activeTab === id ? '' : 'opacity-70'}`} />
      <span className="font-medium tracking-wide">{label}</span>
      {activeTab === id && <span className="absolute right-3"><Icon name="ChevronRight" size={14} className="opacity-50" /></span>}
    </button>
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-50 dark:bg-slate-950 bg-texture transition-colors duration-500">
      {/* Main Full-Screen Container */}
      <div className="relative z-10 flex flex-row h-full w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl overflow-hidden">
        
        {/* Main Sidebar (Modules) - Fixed width for Desktop */}
        <div className="w-64 border-r border-slate-200/50 dark:border-slate-800/50 flex flex-col flex-shrink-0 bg-white/30 dark:bg-slate-900/30 h-full z-20">
          
          {/* Header */}
          <div className="p-6 flex items-center gap-3">
             <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 dark:from-white dark:to-slate-200 flex items-center justify-center text-white dark:text-slate-900 shadow-lg shrink-0">
               <Icon name="Shield" size={16} />
             </div>
             <div className="flex flex-col">
               <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white block">{t.adminPanel}</span>
               <span className="text-[9px] text-slate-400 font-medium uppercase tracking-widest">Workspace OS</span>
             </div>
          </div>
          
          {/* Nav Items */}
          <div className="flex-1 px-4 flex flex-col gap-2">
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 mb-2">Modules</div>
             <NavItem id="agents" icon="Bot" label={t.agentManagement} />
             <NavItem id="rag" icon="Database" label={t.ragKnowledge} />
             <NavItem id="eval" icon="FlaskConical" label={t.evalLab} />
          </div>

          {/* Footer Controls */}
          <div className="p-6 space-y-3 border-t border-slate-200/50 dark:border-slate-800/50 bg-white/20 dark:bg-black/20 backdrop-blur-sm flex flex-col">
            <div className="flex items-center gap-2">
              <button onClick={onToggleTheme} className="flex items-center justify-center flex-1 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary-500 dark:hover:text-primary-400 transition-all shadow-sm">
                 <Icon name={themeIcon} size={16} />
              </button>
              <button onClick={onToggleLanguage} className="flex items-center justify-center flex-1 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary-500 dark:hover:text-primary-400 transition-all shadow-sm font-bold text-xs">
                 {language === 'zh' ? 'EN' : '中'}
              </button>
            </div>
            <button onClick={onBack} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-md hover:shadow-lg group">
              <Icon name="ArrowLeft" size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-bold">{t.backToChat}</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {activeTab === 'agents' && (
             <AgentPlayground 
               language={language} 
               knowledgeBases={knowledgeBases} 
               documents={documents} 
             />
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
