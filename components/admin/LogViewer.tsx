
import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../../types';
import { Icon } from '../Icon';

interface LogViewerProps {
  logs: LogEntry[];
}

export const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
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
