
import { AgentConfig, Message, Role } from '../types';

export interface AgnoAgent {
  agent_id: string;
  name: string;
  description?: string;
  instructions?: string;
  model?: string;
}

/**
 * Normalizes the base URL.
 * 1. Ensures protocol (http/https).
 * 2. Removes trailing slashes.
 * 3. intelligently ensures '/v1' presence for standard Agno routes if missing.
 */
const normalizeBaseUrl = (url: string) => {
  if (!url) return '';
  let normalized = url.trim().replace(/\/+$/, '');
  
  // Auto-prepend protocol if missing
  if (!normalized.match(/^https?:\/\//)) {
    // Default to http for localhost, https otherwise if protocol missing
    if (normalized.includes('localhost') || normalized.includes('127.0.0.1')) {
      normalized = `http://${normalized}`;
    } else {
      normalized = `https://${normalized}`;
    }
  }

  // Agno/Phidata usually serves APIs at /v1. 
  // If the user entered 'http://localhost:7777', append '/v1'.
  // If they entered 'http://localhost:7777/v1', leave it.
  if (!normalized.endsWith('/v1')) {
    normalized = `${normalized}/v1`;
  }

  return normalized;
};

export const fetchAgnoAgents = async (baseUrl: string, apiKey?: string): Promise<AgentConfig[]> => {
  try {
    const normalizedUrl = normalizeBaseUrl(baseUrl);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // CRITICAL: Only add Authorization header if apiKey is present and non-empty.
    if (apiKey && apiKey.trim().length > 0) {
      headers['Authorization'] = `Bearer ${apiKey.trim()}`;
    }

    console.log(`[AgnoService] Fetching agents from: ${normalizedUrl}/agents`);

    const response = await fetch(`${normalizedUrl}/agents`, {
      method: 'GET',
      headers,
      mode: 'cors', // Explicitly request CORS
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      console.warn(`[AgnoService] Failed to fetch agents: ${response.status} ${errorText}`);
      throw new Error(`Server returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    // Support both array and object wrapper formats
    const agentsList = Array.isArray(data) ? data : (data.agents || []);

    return agentsList.map((a: AgnoAgent, index: number) => ({
      id: a.agent_id,
      name: a.name || `Agno Agent ${index + 1}`,
      name_zh: a.name || `Agno Agent ${index + 1}`,
      description: a.description || 'Remote Agno Agent',
      description_zh: a.description || '远程 Agno 智能体',
      systemInstruction: a.instructions || '',
      icon: 'Bot',
      color: 'text-blue-500',
      themeColor: 'blue',
      model: a.model || 'gpt-4o',
      type: 'agent',
      promptVersions: [],
      currentVersion: 1,
      metrics: { qualityScore: 80, interactionCount: 0, satisfactionRate: 0 }
    }));
  } catch (e) {
    console.error("[AgnoService] Error fetching agents:", e);
    throw e;
  }
};

export const streamAgnoChat = async (
  agentId: string,
  sessionId: string,
  message: string,
  baseUrl: string,
  apiKey: string | undefined,
  onChunk: (text: string) => void,
  onComplete: (fullText: string) => void,
  onError: (err: Error) => void
) => {
  try {
    const normalizedUrl = normalizeBaseUrl(baseUrl);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey && apiKey.trim().length > 0) {
      headers['Authorization'] = `Bearer ${apiKey.trim()}`;
    }

    console.log(`[AgnoService] Streaming chat to: ${normalizedUrl}/agent/runs`);

    // Use /agent/runs based on standard schema patterns
    const response = await fetch(`${normalizedUrl}/agent/runs`, {
      method: 'POST',
      headers,
      mode: 'cors',
      body: JSON.stringify({
        agent_id: agentId,
        session_id: sessionId,
        input: message,
        stream: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`Agno API Error (${response.status}): ${errorText}`);
    }

    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      // Keep the last partial line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        
        // Remove "data: " prefix if present (SSE format)
        let jsonStr = line.startsWith('data: ') ? line.slice(6) : line;
        
        if (jsonStr.trim() === '[DONE]') continue;

        try {
          const event = JSON.parse(jsonStr);
          
          if (event.event === 'RunContent' && event.content) {
            accumulatedText += event.content;
            onChunk(accumulatedText);
          } else if (event.event === 'RunCompleted') {
             // If full content is available in completion event, use it to ensure accuracy
             if (event.content) {
                accumulatedText = event.content;
                onChunk(accumulatedText);
             }
          }
        } catch (e) {
          // Ignore partial JSON parse errors
        }
      }
    }

    onComplete(accumulatedText);

  } catch (error) {
    console.error("[AgnoService] Stream Error:", error);
    onError(error instanceof Error ? error : new Error("Unknown error"));
  }
};
