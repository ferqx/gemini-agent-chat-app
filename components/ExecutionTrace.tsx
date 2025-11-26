



import React, { useState } from 'react';
import { LogEntry } from '../types';
import { Icon } from './Icon';

interface ExecutionTraceProps {
  logs: LogEntry[];
  isStreaming?: boolean;
}

export const ExecutionTrace: React.FC<ExecutionTraceProps> = ({ logs, isStreaming }) => {
  const [isExpanded, setIsExpanded] = useState(isStreaming || (logs && logs.length > 0));

  // Auto-expand while streaming new logs
  React.useEffect(() => {
    if (isStreaming) {
      setIsExpanded(true);
    }
  }, [isStreaming, logs?.length]);

  if (!logs || logs.length === 0) return null;

  const getIconForType = (type: LogEntry['type']) => {
    switch (type) {
      case 'rag': return 'Database'; // Memory Extraction
      case 'tool': return 'Wrench'; // Tool Call
      case 'mcp': return 'Server'; // MCP Call
      case 'step': return 'Cpu'; // Thinking/Processing
      case 'router': return 'GitMerge'; // Agent Router
      case 'error': return 'AlertTriangle';
      case 'success': return 'CheckCircle2';
      default: return 'Info';
    }
  };

  const getColorForType = (type: LogEntry['type']) => {
    switch (type) {
      case 'rag': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400';
      case 'tool': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400';
      case 'mcp': return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400';
      case 'step': return 'text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-300';
      case 'router': return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400';
      case 'error': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
      case 'success': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400';
      default: return 'text-slate-500 bg-slate-50 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="mb-4 w-full max-w-full">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition-colors mb-2 group"
      >
        <div className={`p-1 rounded bg-slate-100 dark:bg-slate-800 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20`}>
           <Icon name={isExpanded ? "ChevronDown" : "ChevronRight"} size={14} />
        </div>
        <span>{isStreaming ? "Processing Request..." : "Execution Trace"}</span>
        <span className="bg-slate-100 dark:bg-slate-800 text-[10px] px-1.5 py-0.5 rounded text-slate-400 font-mono">
           {logs.length} steps
        </span>
      </button>

      {isExpanded && (
        <div className="relative pl-3 ml-1.5 border-l-2 border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 pb-2">
          {logs.map((log, index) => (
            <div key={log.id || index} className="relative group">
               {/* Dot on timeline */}
               <div className={`absolute -left-[19px] top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 shadow-sm ${
                  log.type === 'error' ? 'bg-red-500' :
                  log.type === 'success' ? 'bg-emerald-500' :
                  log.type === 'mcp' ? 'bg-purple-500' :
                  log.type === 'rag' ? 'bg-blue-500' :
                  'bg-slate-300 dark:bg-slate-600'
               }`}></div>

               <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-1.5 rounded-md shrink-0 ${getColorForType(log.type)}`}>
                     <Icon name={getIconForType(log.type)} size={12} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                     <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                           {log.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                           {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                        </span>
                     </div>
                     
                     {log.agentName && (
                        <div className="text-[10px] text-primary-500 font-medium mb-0.5 flex items-center gap-1">
                           <span>via</span>
                           <Icon name="Bot" size={10} />
                           {log.agentName}
                        </div>
                     )}

                     {log.details && (
                        <div className="mt-1.5 bg-slate-50 dark:bg-black/20 rounded p-2 border border-slate-100 dark:border-slate-800/50 overflow-x-auto w-full">
                           {typeof log.details === 'string' ? (
                              <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono whitespace-pre-wrap leading-relaxed break-words">
                                 {log.details}
                              </p>
                           ) : (
                              <pre className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                                 {JSON.stringify(log.details, null, 2)}
                              </pre>
                           )}
                        </div>
                     )}
                  </div>
               </div>
            </div>
          ))}
          {isStreaming && (
             <div className="relative group">
                 <div className="absolute -left-[19px] top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
                 <div className="flex items-center gap-2 text-xs text-slate-400 animate-pulse pl-1">
                   <Icon name="Loader2" size={12} className="animate-spin" />
                   <span>Thinking...</span>
                 </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
};
