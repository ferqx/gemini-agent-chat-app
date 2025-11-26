import { GoogleGenAI } from "@google/genai";
import { AgentConfig, Message, Attachment, KnowledgeDocument, RetrievalResult, LogEntry } from '../types';

// Initialize with process.env.API_KEY as required by guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const streamGeminiResponse = async (
  agent: AgentConfig,
  history: Message[],
  text: string,
  attachments: Attachment[],
  onChunk: (text: string) => void,
  onComplete: (fullText: string) => void,
  onError: (err: Error) => void,
  tools?: AgentConfig[],
  documents?: KnowledgeDocument[],
  onLog?: (log: LogEntry) => void
) => {
  try {
    const model = agent.model && agent.model.includes('gemini') ? agent.model : 'gemini-2.5-flash';
    
    // Construct contents from history
    // Filter out system messages as they should be in systemInstruction
    const contents = history
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

    // If the last message in history is not the current text (or history is empty), add the new prompt
    const lastMsg = history[history.length - 1];
    if ((!lastMsg || lastMsg.role !== 'user' || lastMsg.text !== text) && text) {
       contents.push({
         role: 'user',
         parts: [{ text: text }]
       });
    }

    const config: any = {
      systemInstruction: agent.systemInstruction,
    };

    // Call API with streaming
    const response = await ai.models.generateContentStream({
      model: model,
      contents: contents,
      config: config
    });

    let fullText = '';
    for await (const chunk of response) {
      const chunkText = chunk.text;
      if (chunkText) {
        fullText += chunkText;
        onChunk(fullText);
      }
    }
    
    onComplete(fullText);
    
    if (onLog) {
       onLog({
          id: Date.now().toString(),
          type: 'success',
          title: 'Gemini Response',
          timestamp: Date.now(),
          agentName: agent.name,
          details: { model, tokens: Math.ceil(fullText.length / 4) }
       });
    }

  } catch (error) {
    console.error("Gemini API Error", error);
    onError(error instanceof Error ? error : new Error(String(error)));
  }
};

export const searchKnowledgeBase = (query: string, documents: KnowledgeDocument[]): RetrievalResult[] => {
  if (!documents) return [];
  // Client-side search simulation based on document names
  // In a real app, this would query a vector DB or backend service
  return documents
    .filter(doc => doc.name.toLowerCase().includes(query.toLowerCase()))
    .map(doc => ({
      docId: doc.id,
      docName: doc.name,
      score: 0.85 + (Math.random() * 0.1),
      excerpt: `...simulated content from ${doc.name} matching "${query}"...`
    }));
};