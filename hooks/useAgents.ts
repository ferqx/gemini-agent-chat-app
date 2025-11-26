
import { useState, useEffect } from 'react';
import { AgentConfig, AGENTS } from '../types';
import { AgnoClient } from '../lib/agno';

export const useAgents = () => {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = async () => {
    setLoading(true);
    const baseUrl = localStorage.getItem('agno_base_url');
    const apiKey = localStorage.getItem('agno_api_key');
    
    if (!baseUrl) {
        setAgents(AGENTS); // Fallback
        setLoading(false);
        return;
    }

    const client = new AgnoClient(baseUrl, apiKey || undefined);
    try {
        const agnoAgents = await client.listAgents();
        const mappedAgents: AgentConfig[] = agnoAgents.map((a, index) => ({
            id: a.agent_id,
            name: a.name || `Agno Agent ${index + 1}`,
            name_zh: a.name,
            description: a.description || 'Remote Agno Agent',
            description_zh: a.description,
            systemInstruction: a.instructions || '',
            icon: 'Bot',
            color: 'text-blue-500',
            themeColor: 'blue',
            model: a.model || 'unknown',
            type: 'agent',
            metrics: { qualityScore: 80, interactionCount: 0, satisfactionRate: 0 }
        }));
        setAgents(mappedAgents.length > 0 ? mappedAgents : AGENTS);
    } catch (e) {
        console.error("Failed to fetch agents:", e);
        setAgents(AGENTS);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
    
    const handleSettingsUpdate = () => fetchAgents();
    window.addEventListener('agno_settings_updated', handleSettingsUpdate);
    return () => window.removeEventListener('agno_settings_updated', handleSettingsUpdate);
  }, []);

  // Stub functions for Playground compatibility (Server-side agents are read-only in this view)
  const saveDraft = () => {};
  const discardDraft = () => {};
  const publishDraft = () => {};
  const updateTestCases = () => {};
  const restoreVersion = () => {};

  return { 
    agents, 
    loading, 
    refreshAgents: fetchAgents,
    saveDraft,
    discardDraft,
    publishDraft,
    updateTestCases,
    restoreVersion
  };
};