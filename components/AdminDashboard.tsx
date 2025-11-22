
import React, { useState } from 'react';
import { Icon } from './Icon';
import { translations, Language } from '../translations';
import { KnowledgeBase } from './KnowledgeBase';
import { useKnowledge } from '../hooks/useKnowledge';
import { AGENTS } from '../types';

interface AdminDashboardProps {
  onBack: () => void;
  language: Language;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, language }) => {
  const [activeTab, setActiveTab] = useState<'agents' | 'rag'>('agents');
  const t = translations[language];
  
  const { 
    knowledgeBases,
    createKnowledgeBase,
    deleteKnowledgeBase,
    documents, 
    uploadDocument, 
    deleteDocument, 
    getStorageUsage, 
    updateDocumentStrategy, 
    startProcessing,
    // Batch
    batchDeleteDocuments,
    batchUpdateStrategy,
    batchStartProcessing
  } = useKnowledge();

  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-950 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Admin Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b border-slate-800">
           <div className="flex items-center gap-2 mb-1">
             <Icon name="Shield" className="text-primary-400" />
             <span className="font-bold text-lg tracking-wide">{t.adminPanel}</span>
           </div>
           <p className="text-xs text-slate-400 uppercase tracking-wider">System Administration</p>
        </div>
        
        <div className="flex-1 py-6 space-y-1 px-3">
           <button
             onClick={() => setActiveTab('agents')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
               activeTab === 'agents' 
                 ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' 
                 : 'text-slate-400 hover:bg-slate-800 hover:text-white'
             }`}
           >
             <Icon name="Bot" size={20} />
             <span className="font-medium">{t.agentManagement}</span>
           </button>

           <button
             onClick={() => setActiveTab('rag')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
               activeTab === 'rag' 
                 ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' 
                 : 'text-slate-400 hover:bg-slate-800 hover:text-white'
             }`}
           >
             <Icon name="Database" size={20} />
             <span className="font-medium">{t.ragKnowledge}</span>
           </button>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={onBack}
            className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Icon name="ArrowLeft" size={18} />
            <span>{t.backToChat}</span>
          </button>
        </div>
      </div>

      {/* Main Admin Content */}
      <div className="flex-1 overflow-hidden relative bg-slate-100 dark:bg-slate-900">
        {activeTab === 'rag' ? (
          <KnowledgeBase 
            knowledgeBases={knowledgeBases}
            onCreateBase={createKnowledgeBase}
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
        ) : (
          <div className="h-full overflow-y-auto p-8">
             <div className="max-w-5xl mx-auto">
               <div className="flex items-center justify-between mb-8">
                 <div>
                   <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t.agentManagement}</h2>
                   <p className="text-slate-500 dark:text-slate-400 mt-1">Configure system agents, prompts, and models.</p>
                 </div>
                 <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-md transition-all">
                   <Icon name="Plus" size={18} />
                   <span>{t.createNewAgent}</span>
                 </button>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {AGENTS.map(agent => (
                   <div key={agent.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative group">
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 hover:text-primary-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                          <Icon name="Edit3" size={18} />
                        </button>
                      </div>

                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                          <Icon name={agent.icon} size={24} className={agent.color} />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-lg">{language === 'zh' ? agent.name_zh : agent.name}</h3>
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase tracking-wider mt-1">
                             {agent.model}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2 h-10">
                        {language === 'zh' ? agent.description_zh : agent.description}
                      </p>
                      
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-700/50">
                        <div className="text-xs font-semibold text-slate-500 mb-1 uppercase">System Instruction</div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono line-clamp-2 opacity-70">
                          {agent.systemInstruction}
                        </p>
                      </div>
                   </div>
                 ))}
               </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
