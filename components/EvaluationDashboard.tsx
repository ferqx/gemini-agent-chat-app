
import React, { useState } from 'react';
import { useEvaluation } from '../hooks/useEvaluation';
import { AgentConfig, EvaluationSuite, EvaluationCase, EvaluationRun } from '../types';
import { Icon } from './Icon';
import { translations, Language } from '../translations';
import { StatusBadge } from './StatusBadge';
import { ConfirmationModal } from './ConfirmationModal';
import { Select } from './Select';

interface EvaluationDashboardProps {
  agents: AgentConfig[];
  language: Language;
}

export const EvaluationDashboard: React.FC<EvaluationDashboardProps> = ({ agents, language }) => {
  const { 
    suites, 
    createSuite, 
    deleteSuite, 
    updateSuiteCases, 
    runSuite, 
    getRunsBySuite, 
    isRunning 
  } = useEvaluation();
  
  const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cases' | 'history'>('cases');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSuiteName, setNewSuiteName] = useState('');
  const [newSuiteDesc, setNewSuiteDesc] = useState('');
  const [deleteSuiteId, setDeleteSuiteId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const t = translations[language];
  const selectedSuite = suites.find(s => s.id === selectedSuiteId);
  const suiteRuns = selectedSuiteId ? getRunsBySuite(selectedSuiteId) : [];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuiteName.trim()) return;
    const id = createSuite(newSuiteName, newSuiteDesc);
    setSelectedSuiteId(id);
    setIsModalOpen(false);
    setNewSuiteName('');
    setNewSuiteDesc('');
  };

  const addCase = () => {
    if (!selectedSuiteId) return;
    const newCase: EvaluationCase = {
      id: Date.now().toString(),
      input: '',
      expectedOutput: ''
    };
    updateSuiteCases(selectedSuiteId, [...(selectedSuite?.cases || []), newCase]);
  };

  const updateCase = (caseId: string, field: 'input' | 'expectedOutput', value: string) => {
    if (!selectedSuite) return;
    const updatedCases = selectedSuite.cases.map(c => 
      c.id === caseId ? { ...c, [field]: value } : c
    );
    updateSuiteCases(selectedSuite.id, updatedCases);
  };

  const deleteCase = (caseId: string) => {
    if (!selectedSuite) return;
    const updatedCases = selectedSuite.cases.filter(c => c.id !== caseId);
    updateSuiteCases(selectedSuite.id, updatedCases);
  };

  const handleRunTest = () => {
    if (!selectedSuiteId || !selectedAgentId) return;
    const agent = agents.find(a => a.id === selectedAgentId);
    if (agent) {
      runSuite(selectedSuiteId, agent);
      setActiveTab('history');
    }
  };

  return (
    <div className="flex flex-row h-full bg-transparent animate-in fade-in slide-in-from-bottom-4">
      {/* Sidebar */}
      <div className="w-72 border-r border-slate-200/50 dark:border-slate-800/50 flex flex-col z-10 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm h-full shrink-0">
        <div className="p-5 border-b border-slate-100/50 dark:border-slate-800/50 flex items-center justify-between shrink-0">
          <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wider">{t.evalSuites}</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="p-1.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
            title={t.createSuite}
          >
            <Icon name="Plus" size={18} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
           {suites.length === 0 && (
             <div className="text-center py-8 px-4 text-slate-400 text-xs">{t.noSuites}</div>
           )}
           {suites.map(suite => (
             <div key={suite.id} className="relative group">
                <button
                  onClick={() => setSelectedSuiteId(suite.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all border ${
                    selectedSuiteId === suite.id 
                      ? 'bg-primary-50/80 dark:bg-primary-900/30 border-primary-200 dark:border-primary-900/30 shadow-sm' 
                      : 'bg-transparent border-transparent hover:bg-white/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-sm font-medium truncate ${selectedSuiteId === suite.id ? 'text-primary-700 dark:text-primary-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {suite.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                    <span>{suite.cases.length} {t.testCaseCount}</span>
                  </div>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setDeleteSuiteId(suite.id); }}
                  className={`absolute top-3 right-3 p-1 text-slate-400 hover:text-red-500 rounded bg-white/50 dark:bg-black/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity ${selectedSuiteId === suite.id ? 'opacity-100' : ''}`}
                >
                  <Icon name="Trash2" size={14} />
                </button>
             </div>
           ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-0 min-h-0">
         {selectedSuite ? (
           <>
             <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm shrink-0">
                <div className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                       <Icon name="FlaskConical" className="text-primary-500" />
                       {selectedSuite.name}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{selectedSuite.description || 'No description'}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm backdrop-blur-sm w-auto">
                     <div className="w-48">
                       <Select
                         value={selectedAgentId}
                         onChange={setSelectedAgentId}
                         options={agents.map(a => ({ value: a.id, label: language === 'zh' ? a.name_zh : a.name, description: `v${a.currentVersion||1}` }))}
                         placeholder={t.selectAgentToTest}
                         className="w-full"
                       />
                     </div>
                     <button
                       onClick={handleRunTest}
                       disabled={!selectedAgentId || isRunning || selectedSuite.cases.length === 0}
                       className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-primary-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all whitespace-nowrap"
                     >
                       {isRunning ? <Icon name="Loader2" className="animate-spin" size={16} /> : <Icon name="Play" size={16} />}
                       {t.runTest}
                     </button>
                  </div>
                </div>

                <div className="flex gap-6 mt-6 overflow-x-auto">
                   <button 
                     onClick={() => setActiveTab('cases')}
                     className={`pb-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'cases' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500'}`}
                   >
                     {t.testCases} ({selectedSuite.cases.length})
                   </button>
                   <button 
                     onClick={() => setActiveTab('history')}
                     className={`pb-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'history' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500'}`}
                   >
                     {t.runHistory}
                   </button>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'cases' && (
                  <div className="space-y-4 max-w-4xl mx-auto">
                    {selectedSuite.cases.map((c, idx) => (
                       <div key={c.id} className="bg-white/60 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm group backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                             <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">#{idx + 1}</span>
                             <button onClick={() => deleteCase(c.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                               <Icon name="X" size={16} />
                             </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                               <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">{t.input}</label>
                               <textarea 
                                 value={c.input}
                                 onChange={(e) => updateCase(c.id, 'input', e.target.value)}
                                 className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-primary-500"
                                 rows={2}
                               />
                             </div>
                             <div>
                               <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">{t.expectedOutput}</label>
                               <textarea 
                                 value={c.expectedOutput || ''}
                                 onChange={(e) => updateCase(c.id, 'expectedOutput', e.target.value)}
                                 className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-primary-500"
                                 rows={2}
                               />
                             </div>
                          </div>
                       </div>
                    ))}
                    <button 
                      onClick={addCase}
                      className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 hover:border-primary-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all flex items-center justify-center gap-2 font-medium text-sm"
                    >
                      <Icon name="Plus" size={16} />
                      {t.addTestCase}
                    </button>
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="space-y-4 max-w-4xl mx-auto">
                     {suiteRuns.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                           <Icon name="History" size={32} className="mx-auto mb-3 opacity-50" />
                           <p>{t.noRuns}</p>
                        </div>
                     )}
                     {suiteRuns.map(run => (
                       <div key={run.id} className="bg-white/60 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden shadow-sm backdrop-blur-sm">
                          <div 
                             className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/80 dark:hover:bg-slate-700/50 transition-colors"
                             onClick={() => setExpandedRunId(expandedRunId === run.id ? null : run.id)}
                          >
                             <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                                   run.overallScore >= 90 ? 'bg-emerald-500' :
                                   run.overallScore >= 70 ? 'bg-primary-500' : 'bg-amber-500'
                                }`}>
                                   {run.overallScore}
                                </div>
                                <div>
                                   <div className="font-bold text-slate-900 dark:text-white text-sm">
                                     {run.agentNameSnapshot} <span className="text-slate-400 font-normal text-xs">v{run.agentVersionSnapshot}</span>
                                   </div>
                                   <div className="text-xs text-slate-500">
                                      {new Date(run.timestamp).toLocaleString()}
                                   </div>
                                </div>
                             </div>
                             <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-400">{run.results.length} cases</span>
                                <Icon name="ChevronDown" size={16} className={`text-slate-400 transition-transform ${expandedRunId === run.id ? 'rotate-180' : ''}`} />
                             </div>
                          </div>
                          {expandedRunId === run.id && (
                             <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 space-y-3">
                                {run.results.map((res, i) => {
                                   const originalCase = selectedSuite.cases.find(c => c.id === res.testCaseId);
                                   return (
                                     <div key={i} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                           <div className="font-medium text-slate-800 dark:text-slate-200 max-w-[80%]">
                                              <span className="text-slate-400 mr-2">Q:</span>
                                              {originalCase?.input || <span className="italic text-slate-400">Deleted case</span>}
                                           </div>
                                           <StatusBadge status={res.pass ? 'success' : 'error'} text={`${res.score}/100`} />
                                        </div>
                                        <div className="pl-4 border-l-2 border-slate-200 dark:border-slate-700 mt-2">
                                           <div className="text-xs text-slate-500 mb-1">Actual Output:</div>
                                           <div className="text-slate-600 dark:text-slate-300 font-mono text-xs bg-slate-50 dark:bg-black/20 p-2 rounded mb-2">
                                              {res.actualOutput}
                                           </div>
                                           <div className="text-xs text-slate-500">
                                              <span className="font-bold text-slate-400 mr-1">Reasoning:</span>
                                              {res.reasoning}
                                           </div>
                                        </div>
                                     </div>
                                   );
                                })}
                             </div>
                          )}
                       </div>
                     ))}
                  </div>
                )}
             </div>
           </>
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
               <Icon name="FlaskConical" size={48} className="mb-4 text-slate-200 dark:text-slate-700" />
               <p>{t.noSuites}</p>
            </div>
         )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-6 border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold mb-4 dark:text-white">{t.createSuite}</h3>
            <form onSubmit={handleCreateSubmit}>
              <div className="space-y-4">
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.suiteName}</label>
                   <input value={newSuiteName} onChange={e => setNewSuiteName(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white" autoFocus />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.suiteDesc}</label>
                   <textarea value={newSuiteDesc} onChange={e => setNewSuiteDesc(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white" rows={3} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="text-sm text-slate-500">{t.cancel}</button>
                 <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold">{t.create}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal isOpen={!!deleteSuiteId} title="Delete Suite" message={t.deleteSuiteMsg} onConfirm={() => { if (deleteSuiteId) deleteSuite(deleteSuiteId); setDeleteSuiteId(null); if (selectedSuiteId === deleteSuiteId) setSelectedSuiteId(null); }} onCancel={() => setDeleteSuiteId(null)} />
    </div>
  );
};
