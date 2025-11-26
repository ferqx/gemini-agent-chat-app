
import React, { useState } from 'react';
import { Icon } from './Icon';
import '../types';

// --- DISPLAY WIDGETS ---

/**
 * Analysis Card Widget
 * Used for presenting data insights, trends, and key metrics.
 */
interface AnalysisCardProps {
  title: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  description: string;
}

export const AnalysisCard: React.FC<AnalysisCardProps> = ({ title, value, trend, trendValue, description }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm my-3 max-w-sm animate-in zoom-in-95 duration-300">
    <div className="flex items-center justify-between mb-2">
      <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{title}</h4>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
          trend === 'up' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
          trend === 'down' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
        }`}>
          <Icon name={trend === 'up' ? 'TrendingUp' : trend === 'down' ? 'TrendingDown' : 'Minus'} size={12} />
          {trendValue}
        </div>
      )}
    </div>
    <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{value}</div>
    <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
  </div>
);

/**
 * Step Process Widget
 * Used for showing a list of steps or a procedure.
 */
interface StepProcessProps {
  title: string;
  steps: { label: string; status: 'completed' | 'current' | 'pending' }[];
}

export const StepProcess: React.FC<StepProcessProps> = ({ title, steps }) => (
  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-4 my-3 max-w-md animate-in slide-in-from-left-2 duration-300">
    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
      <Icon name="ListOrdered" size={16} className="text-primary-500" />
      {title}
    </h4>
    <div className="space-y-3 relative">
      {/* Connector Line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-700 z-0"></div>
      
      {steps.map((step, idx) => (
        <div key={idx} className="flex items-start gap-3 relative z-10">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 ${
            step.status === 'completed' ? 'bg-primary-500 border-primary-500 text-white' :
            step.status === 'current' ? 'bg-white dark:bg-slate-900 border-primary-500 text-primary-500 animate-pulse' :
            'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-300'
          }`}>
            {step.status === 'completed' ? <Icon name="Check" size={12} /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
          </div>
          <div className={`text-sm pt-0.5 ${step.status === 'pending' ? 'text-slate-400' : 'text-slate-700 dark:text-slate-200 font-medium'}`}>
            {step.label}
          </div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Status Alert Widget
 * Used for highlighting important status updates or warnings.
 */
interface StatusAlertProps {
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
}

export const StatusAlert: React.FC<StatusAlertProps> = ({ type, message }) => {
  const styles = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
    error: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
    info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
  };

  const icons = {
    success: 'CheckCircle2',
    warning: 'AlertTriangle',
    error: 'XCircle',
    info: 'Info'
  };

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${styles[type]} my-2 text-sm animate-in fade-in duration-300`}>
      <Icon name={icons[type]} size={18} className="shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
};

// --- INTERACTIVE WIDGETS ---

export interface InputField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'select' | 'textarea';
  options?: string[]; // for select
  placeholder?: string;
  required?: boolean;
}

interface InputFormProps {
  id: string;
  title: string;
  fields: InputField[];
  submitLabel?: string;
  onInteract?: (type: string, data: any) => void;
}

export const InputForm: React.FC<InputFormProps> = ({ id, title, fields, submitLabel = "Submit", onInteract }) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onInteract) {
      onInteract('form_submission', { widgetId: id, data: formData });
      setSubmitted(true);
    }
  };

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (submitted) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-6 my-3 animate-in fade-in text-center max-w-md">
        <Icon name="CheckCircle2" className="mx-auto text-emerald-500 mb-2" size={32} />
        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Submitted</h4>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 my-3 max-w-md shadow-sm animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">
         <Icon name="FileText" size={16} className="text-primary-500" />
         <h4 className="font-bold text-sm text-slate-900 dark:text-white">{title}</h4>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.name}>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{field.label}</label>
            {field.type === 'select' ? (
              <div className="relative">
                <select
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all appearance-none"
                  required={field.required}
                >
                  <option value="" disabled>Select...</option>
                  {field.options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <Icon name="ChevronDown" size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
              </div>
            ) : field.type === 'textarea' ? (
              <textarea
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all min-h-[80px] resize-none"
                placeholder={field.placeholder}
                required={field.required}
              />
            ) : (
              <input
                type={field.type}
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                placeholder={field.placeholder}
                required={field.required}
              />
            )}
          </div>
        ))}
        <button
          type="submit"
          className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold text-sm shadow-lg shadow-primary-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <span>{submitLabel}</span>
          <Icon name="ArrowRight" size={14} />
        </button>
      </form>
    </div>
  );
};

interface OptionSelectorProps {
  id: string;
  title?: string;
  options: { label: string; value: string; description?: string }[];
  onInteract?: (type: string, data: any) => void;
}

export const OptionSelector: React.FC<OptionSelectorProps> = ({ id, title, options, onInteract }) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (value: string) => {
    if (selected) return; // Prevent multiple selections
    setSelected(value);
    if (onInteract) {
      onInteract('option_selection', { widgetId: id, value });
    }
  };

  return (
    <div className="my-3 max-w-md animate-in slide-in-from-left-2 duration-300">
      {title && <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3 ml-1 flex items-center gap-2"><Icon name="HelpCircle" size={14} className="text-primary-500"/>{title}</h4>}
      <div className="grid gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            disabled={!!selected}
            className={`text-left p-3 rounded-xl border transition-all relative overflow-hidden group ${
              selected === opt.value
                ? 'bg-primary-600 border-primary-600 text-white shadow-md'
                : selected
                ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 text-slate-400 opacity-60'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-sm'
            }`}
          >
             <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{opt.label}</span>
                {selected === opt.value && <Icon name="Check" size={16} />}
                {!selected && <Icon name="ArrowRight" size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-primary-500" />}
             </div>
             {opt.description && (
               <div className={`text-xs mt-1 ${selected === opt.value ? 'text-primary-100' : 'text-slate-500 dark:text-slate-400'}`}>
                 {opt.description}
               </div>
             )}
          </button>
        ))}
      </div>
    </div>
  );
};

// --- RENDERER ---

interface WidgetRendererProps {
  type: string;
  props: any;
  onInteract?: (type: string, data: any) => void;
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({ type, props, onInteract }) => {
  switch (type) {
    case 'analysis-card':
      return <AnalysisCard {...props} />;
    case 'step-process':
      return <StepProcess {...props} />;
    case 'status-alert':
      return <StatusAlert {...props} />;
    case 'input-form':
      return <InputForm {...props} onInteract={onInteract} />;
    case 'option-selector':
      return <OptionSelector {...props} onInteract={onInteract} />;
    default:
      return <div className="text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100">Unknown Widget: {type}</div>;
  }
};
