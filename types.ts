
export interface AgnoAgent {
  agent_id: string;
  name: string;
  description?: string;
  instructions?: string;
  model?: string;
  created_at?: number;
  updated_at?: number;
}

export interface AgnoSession {
  session_id: string;
  agent_id: string;
  title?: string;
  user_id?: string;
  created_at: number;
  updated_at: number;
  memory?: Record<string, any>;
}

export interface AgnoMessage {
  role: 'user' | 'model' | 'system' | 'tool';
  content: string;
  created_at: number;
  metrics?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    duration?: number;
  };
}

export interface AgnoTeam {
  team_id: string;
  name: string;
  description?: string;
  members?: string[];
}

export interface RunContent {
  created_at: number;
  event: 'RunContent';
  agent_id: string;
  agent_name: string;
  run_id: string;
  session_id: string;
  content: string;
  content_type: string;
  reasoning_content?: string;
}

export interface RunCompleted {
  created_at: number;
  event: 'RunCompleted';
  agent_id: string;
  agent_name: string;
  run_id: string;
  session_id: string;
  content: string;
  content_type: string;
  metrics?: any;
}

// App Internal Types
export enum Role {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface Attachment {
  name?: string;
  mimeType: string;
  data: string; // base64
}

export interface LogEntry {
  id: string;
  type: 'rag' | 'tool' | 'mcp' | 'step' | 'router' | 'error' | 'success';
  title: string;
  timestamp: number;
  agentName?: string;
  details?: any;
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  attachments?: Attachment[];
  timestamp: number;
  isStreaming?: boolean;
  agentName?: string;
  feedback?: 'up' | 'down';
  metrics?: any;
  logs?: LogEntry[];
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  agentId: string;
  lastModified: number;
}

export interface UserProfile {
  name: string;
  avatar?: string;
}

export type ThemeColor = 'blue' | 'emerald' | 'violet' | 'amber' | 'rose';

export interface AgentMetrics {
  qualityScore: number;
  interactionCount: number;
  satisfactionRate: number;
}

export interface PromptVersion {
  version: number;
  timestamp: number;
  changeLog: string;
  systemInstruction: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  name_zh?: string;
  description: string;
  description_zh?: string;
  systemInstruction: string; 
  icon: string;
  color: string;
  themeColor: ThemeColor;
  model: string;
  type?: 'agent' | 'supervisor'; 
  metrics?: AgentMetrics;
  knowledgeBaseId?: string;
  subAgentIds?: string[];
  draftConfig?: Partial<AgentConfig>;
  promptVersions?: PromptVersion[];
  currentVersion?: number;
}

// Knowledge Types
export type KnowledgeStatus = 'uploading' | 'uploaded' | 'processing' | 'indexing' | 'ready' | 'error';
export type ChunkingStrategy = 'fixed' | 'semantic' | 'hierarchical';

export interface KnowledgeDocument {
  id: string;
  knowledgeBaseId: string;
  name: string;
  type: 'pdf' | 'txt' | 'md';
  size: number;
  status: KnowledgeStatus;
  progress: number;
  uploadedAt: number;
  chunkingStrategy: ChunkingStrategy;
}

export interface KnowledgeBaseItem {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}

export interface RetrievalResult {
  docId: string;
  docName: string;
  score: number;
  excerpt: string;
}

// Evaluation Types
export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
}

export interface TestResult {
  testCaseId?: string;
  pass: boolean;
  score: number;
  actualOutput: string;
  reasoning: string;
}

export interface EvaluationCase {
  id: string;
  input: string;
  expectedOutput?: string;
}

export interface EvaluationSuite {
  id: string;
  name: string;
  description: string;
  cases: EvaluationCase[];
  createdAt: number;
  updatedAt: number;
}

export interface EvaluationRun {
  id: string;
  suiteId: string;
  suiteNameSnapshot: string;
  agentId: string;
  agentNameSnapshot: string;
  agentVersionSnapshot: number;
  timestamp: number;
  overallScore: number;
  results: TestResult[];
}

export const AVAILABLE_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Google', description_zh: 'Google' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', description: 'Google', description_zh: 'Google' },
];

export const AGENTS: AgentConfig[] = [
  {
    id: 'default-agent',
    name: 'Helpful Assistant',
    name_zh: '智能助手',
    description: 'A generic helpful assistant.',
    description_zh: '通用的智能助手。',
    systemInstruction: 'You are a helpful assistant.',
    icon: 'Bot',
    color: 'text-blue-500',
    themeColor: 'blue',
    model: 'gemini-2.5-flash',
    type: 'agent'
  }
];