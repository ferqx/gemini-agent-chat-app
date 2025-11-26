
import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../Icon';
import { translations, Language } from '../../translations';
import { AgentConfig, KnowledgeBaseItem, KnowledgeDocument } from '../../types';
import { MessageBubble } from '../MessageBubble';
import { ChatInput } from '../ChatInput';
import { Select } from '../Select';
import { Drawer } from '../Drawer';
import { AgentEditor } from '../AgentEditor';
import { LogViewer } from './LogViewer';
import { usePlayground } from '../../hooks/usePlayground';
import { useAgents } from '../../hooks/useAgents';

interface AgentPlaygroundProps {
  language: Language;
  knowledgeBases: KnowledgeBaseItem[];
  documents: KnowledgeDocument[];
}

type AgentCategory = 'supervisors' | 'agents' | 'workflows';

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

export const AgentPlayground: React.FC<AgentPlaygroundProps> = ({ 
  language, 
  knowledgeBases, 
  documents 
}) => {
  const t = translations[language];
  const { agents, saveDraft, publishDraft, discardDraft, updateTestCases, restoreVersion } = useAgents();
  
  const [category, setCategory] = useState<AgentCategory>('agents');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isAgentEditorOpen, setIsAgentEditorOpen] = useState(false);
  const [rightPanelMode, setRightPanelMode] = useState<'config' | 'history' | 'logs' | 'none'>('none');
  const playgroundMessagesEndRef = useRef<HTMLDivElement>(null);

  // Filter agents
  const supervisors = agents.filter(a => a.type === 'supervisor');
  const standardAgents = agents.filter(a => a.type !== 'supervisor');

  // Select default agent if none
  useEffect(() => {
    if (!selectedAgentId && agents.length > 0) {
      const firstAgent = agents[0];
      setSelectedAgentId(firstAgent.id);
      setCategory(firstAgent.type === 'supervisor' ? 'supervisors' : 'agents');
    }
  }, [agents.length]); // Only run on mount/agents change

  const selectedAgent = agents.find(a => a.id === selectedAgentId);
  const currentList = category === 'supervisors' ? supervisors : (category === 'agents' ? standardAgents : []);

  const {
    playSessions,
    activePlaySession,
    setCurrentPlaySessionId,
    playMessages,
    isPlayStreaming,
    executionLogs,
    handleNewSession,
    deleteSession,
    handlePlaygroundSend
  } = usePlayground(agents, selectedAgentId, documents, language);

  // Auto-scroll
  useEffect(() => {
     playgroundMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [playMessages.length, isPlayStreaming]);

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat as AgentCategory);
    let newList: AgentConfig[] = [];
    if (newCat === 'supervisors') newList = supervisors;
    else if (newCat === 'agents') newList = standardAgents;
    
    if (newList.length > 0) setSelectedAgentId(newList[0].id);
    else setSelectedAgentId(null);
  };

  return (
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
                          options={playSessions.filter(s => s.agentId === selectedAgentId).map(s => ({
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
                  onClick={() => setIsAgentEditorOpen(true)}
                  className="p-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                  title={t.editAgent}
                >
                  <Icon name="Edit3" size={16} />
                  <span className="hidden sm:inline">{t.edit}</span>
                </button>
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
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
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 hover-scrollbar">
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
            <div ref={playgroundMessagesEndRef} className="h-4" />
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
                      <button 
                        onClick={() => setIsAgentEditorOpen(true)}
                        className="text-xs text-primary-600 hover:underline"
                      >
                        Switch to Editor
                      </button>
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
                  {playSessions.filter(s => s.agentId === selectedAgentId).map(session => (
                      <div 
                        key={session.id}
                        onClick={() => setCurrentPlaySessionId(session.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-all border ${
                          session.id === activePlaySession?.id
                          ? 'bg-white dark:bg-slate-800 border-primary-500 ring-1 ring-primary-500 shadow-sm'
                          : 'bg-transparent border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className={`font-medium text-xs ${session.id === activePlaySession?.id ? 'text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-300'} truncate flex-1 pr-2`}>
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
                  {playSessions.filter(s => s.agentId === selectedAgentId).length === 0 && (
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

      {isAgentEditorOpen && selectedAgent && (
        <AgentEditor 
           agent={selectedAgent}
           allAgents={agents}
           knowledgeBases={knowledgeBases}
           onSaveDraft={saveDraft}
           onPublish={publishDraft}
           onDiscardDraft={discardDraft}
           onUpdateTestCases={updateTestCases}
           onRestore={restoreVersion}
           onClose={() => setIsAgentEditorOpen(false)}
           language={language}
        />
      )}
    </div>
  );
};
