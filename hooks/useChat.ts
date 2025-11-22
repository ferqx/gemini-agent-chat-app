
import { useState, useEffect } from 'react';
import { Session, Message, AgentConfig, Attachment, Role, AGENTS } from '../types';
import { streamGeminiResponse, generateChatSuggestions } from '../services/geminiService';
import { Language, translations } from '../translations';
import { UserProfile } from '../types';

const STORAGE_KEY = 'agno_chat_sessions';

/**
 * Comprehensive hook to manage chat sessions, messages, and interactions with the Gemini API.
 * Handles state for sessions, current selection, streaming status, and message updates.
 * 
 * @param {Language} language - Current UI language.
 * @param {UserProfile} userProfile - Current user profile for context if needed.
 * @returns {Object} Chat state and handler functions.
 */
export const useChat = (language: Language, userProfile: UserProfile) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [activeAgent, setActiveAgent] = useState<AgentConfig>(AGENTS[0]);
  const [modelId, setModelId] = useState<string>(AGENTS[0].model);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Derived state
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession ? currentSession.messages : [];

  // Load sessions
  useEffect(() => {
    const savedSessions = localStorage.getItem(STORAGE_KEY);
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed);
        if (parsed.length > 0) {
          setCurrentSessionId(parsed[0].id);
          const agent = AGENTS.find(a => a.id === parsed[0].agentId) || AGENTS[0];
          setActiveAgent(agent);
        }
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    }
  }, []);

  // Save sessions
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  // Sync model when agent changes
  useEffect(() => {
    setModelId(activeAgent.model);
  }, [activeAgent.id]);

  // Clear suggestions when switching sessions
  useEffect(() => {
    setSuggestions([]);
    setIsGeneratingSuggestions(false);
  }, [currentSessionId]);

  /**
   * Helper function to update messages for a specific session.
   * Moves the updated session to the top of the list (most recently modified).
   * 
   * @param {string} sessionId - ID of the session to update.
   * @param {Message[]} newMessages - The new array of messages.
   */
  const updateSessionMessages = (sessionId: string, newMessages: Message[]) => {
    setSessions(prev => {
      const sessionIndex = prev.findIndex(s => s.id === sessionId);
      if (sessionIndex === -1) return prev;

      const updatedSession = { 
        ...prev[sessionIndex], 
        messages: newMessages, 
        lastModified: Date.now() 
      };
      
      const otherSessions = prev.filter(s => s.id !== sessionId);
      return [updatedSession, ...otherSessions];
    });
  };

  /**
   * Initiates the streaming request to the Gemini service.
   * Manages the loading state and real-time message updates.
   * 
   * @param {string} sessionId - The ID of the session.
   * @param {Message[]} chatHistory - The history of messages to send.
   * @param {string} text - The user's prompt.
   * @param {Attachment[]} attachments - Attached files.
   */
  const processGeminiRequest = async (sessionId: string, chatHistory: Message[], text: string, attachments: Attachment[]) => {
    setIsStreaming(true);
    setSuggestions([]); // Clear suggestions while generating
    
    const agentMsgId = (Date.now() + 1).toString();
    const placeholderMsg: Message = {
      id: agentMsgId,
      role: Role.MODEL,
      text: '',
      timestamp: Date.now(),
      isStreaming: true,
      agentName: language === 'zh' ? activeAgent.name_zh : activeAgent.name
    };

    updateSessionMessages(sessionId, [...chatHistory, placeholderMsg]);

    const langInstruction = language === 'zh' 
      ? "\n\n请主要使用中文回答，除非用户要求其他语言。" 
      : "\n\nPlease answer in English unless requested otherwise.";

    const configuredAgent = {
      ...activeAgent,
      systemInstruction: activeAgent.systemInstruction + langInstruction
    };

    await streamGeminiResponse(
      { ...configuredAgent, model: modelId },
      chatHistory,
      text,
      attachments,
      (chunkText) => {
        setSessions(prev => prev.map(s => {
          if (s.id === sessionId) {
             const msgs = s.messages.map(m => 
               m.id === agentMsgId ? { ...m, text: chunkText } : m
             );
             return { ...s, messages: msgs, lastModified: Date.now() };
          }
          return s;
        }));
      },
      async (fullText) => {
        setSessions(prev => prev.map(s => {
          if (s.id === sessionId) {
             const msgs = s.messages.map(m => 
               m.id === agentMsgId ? { ...m, text: fullText, isStreaming: false } : m
             );
             return { ...s, messages: msgs, lastModified: Date.now() };
          }
          return s;
        }));
        setIsStreaming(false);
        
        // Generate dynamic suggestions based on the actual conversation content
        // We pass the history leading up to the response, plus the response itself
        const contextForSuggestions = [...chatHistory, { role: Role.USER, text, attachments } as Message];
        try {
          setIsGeneratingSuggestions(true);
          const newSuggestions = await generateChatSuggestions(contextForSuggestions, fullText, language);
          setSuggestions(newSuggestions);
        } catch (e) {
          console.warn("Failed to generate suggestions", e);
        } finally {
          setIsGeneratingSuggestions(false);
        }
      },
      (error) => {
        setSessions(prev => prev.map(s => {
          if (s.id === sessionId) {
             const msgs = s.messages.map(m => 
               m.id === agentMsgId ? { ...m, text: `Error: ${error.message}`, isStreaming: false } : m
             );
             return { ...s, messages: msgs, lastModified: Date.now() };
          }
          return s;
        }));
        setIsStreaming(false);
      }
    );
  };

  /**
   * Handles sending a new message from the user.
   * Creates a new session if one doesn't exist.
   * 
   * @param {string} text - User's message text.
   * @param {Attachment[]} attachments - Files to attach.
   */
  const handleSendMessage = async (text: string, attachments: Attachment[]) => {
    setSuggestions([]); // Clear suggestions on send
    setIsGeneratingSuggestions(false);
    
    let sessionId = currentSessionId;
    let currentMessages = messages;

    if (!sessionId) {
      sessionId = Date.now().toString();
      const newSession: Session = {
        id: sessionId,
        title: text.slice(0, 30) + (text.length > 30 ? '...' : ''),
        messages: [],
        agentId: activeAgent.id,
        lastModified: Date.now(),
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(sessionId);
      currentMessages = [];
    }

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: text,
      attachments: attachments,
      timestamp: Date.now(),
    };

    const updatedMessages = [...currentMessages, newUserMsg];
    updateSessionMessages(sessionId, updatedMessages);
    
    await processGeminiRequest(sessionId, updatedMessages, text, attachments);
  };

  /**
   * Edits an existing user message and regenerates the response.
   * 
   * @param {string} messageId - The ID of the message to edit.
   * @param {string} newText - The new text content.
   */
  const handleEditMessage = async (messageId: string, newText: string) => {
    if (!currentSessionId) return;
    
    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;

    const historyToKeep = messages.slice(0, msgIndex);
    const oldMsg = messages[msgIndex];
    const updatedMsg: Message = {
      ...oldMsg,
      text: newText,
      timestamp: Date.now() 
    };

    const newHistory = [...historyToKeep, updatedMsg];
    updateSessionMessages(currentSessionId, newHistory);

    await processGeminiRequest(
      currentSessionId, 
      newHistory, 
      newText, 
      updatedMsg.attachments || []
    );
  };

  /**
   * Deletes a single message or a message pair.
   * Implements bidirectional deletion:
   * 1. If a USER message is deleted -> Deletes subsequent MODEL response.
   * 2. If a MODEL message is deleted -> Deletes preceding USER prompt.
   * 
   * @param {string} messageId - The ID of the message to delete.
   */
  const handleDeleteMessage = (messageId: string) => {
    if (!currentSessionId) return;
    
    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;

    const newMessages = [...messages];
    const msg = newMessages[msgIndex];
    
    // Logic: Maintain conversational integrity by deleting pairs.
    if (msg.role === Role.USER) {
      // Case 1: User message deleted -> Delete it AND the potential next AI response
      if (newMessages[msgIndex + 1]?.role === Role.MODEL) {
        newMessages.splice(msgIndex, 2);
      } else {
        newMessages.splice(msgIndex, 1);
      }
    } else if (msg.role === Role.MODEL) {
      // Case 2: AI message deleted -> Delete it AND the potential preceding User prompt
      if (msgIndex > 0 && newMessages[msgIndex - 1]?.role === Role.USER) {
        // Delete the previous message (User) and the current message (AI)
        newMessages.splice(msgIndex - 1, 2);
      } else {
        newMessages.splice(msgIndex, 1);
      }
    } else {
      // Fallback (e.g., system messages)
      newMessages.splice(msgIndex, 1);
    }

    updateSessionMessages(currentSessionId, newMessages);
    
    // If we deleted the last message, clear suggestions
    if (newMessages.length === 0 || newMessages[newMessages.length - 1].role === Role.USER) {
      setSuggestions([]);
      setIsGeneratingSuggestions(false);
    }
  };

  /**
   * Records user feedback (thumbs up/down) for a model message.
   * 
   * @param {string} messageId - ID of the message.
   * @param {'up' | 'down'} type - Feedback type.
   */
  const handleFeedback = (messageId: string, type: 'up' | 'down') => {
    if (!currentSessionId) return;
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        const msgs = s.messages.map(m => 
          m.id === messageId ? { ...m, feedback: type } : m
        );
        return { ...s, messages: msgs };
      }
      return s;
    }));
  };

  /**
   * Deletes a specific session.
   * 
   * @param {string} sessionId - ID of the session to delete.
   */
  const handleDeleteSession = (sessionId: string) => {
    const newSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(newSessions);
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
    }
  };

  /**
   * Clears all messages from the current session but keeps the session itself.
   */
  const handleClearChat = () => {
    if (currentSessionId) {
      updateSessionMessages(currentSessionId, []);
      setSuggestions([]);
      setIsGeneratingSuggestions(false);
    }
  };
  
  const clearSuggestions = () => {
    setSuggestions([]);
    setIsGeneratingSuggestions(false);
  };

  /**
   * Exports the current chat to a Markdown file and triggers a download.
   */
  const handleExportChat = () => {
    if (!currentSessionId || messages.length === 0) return;
    
    const title = currentSession?.title || 'chat-export';
    const content = messages.map(m => {
      const agentName = language === 'zh' ? (activeAgent.name_zh || activeAgent.name) : activeAgent.name;
      const userName = userProfile.name || (language === 'zh' ? '用户' : 'User');
      const role = m.role === Role.USER ? userName : (m.agentName || agentName);
      return `### ${role} (${new Date(m.timestamp).toLocaleString()})\n\n${m.text}\n`;
    }).join('\n---\n\n');

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Resets current session selection to start a new chat.
   */
  const handleNewChat = () => {
    setCurrentSessionId(null);
    setSuggestions([]);
    setIsGeneratingSuggestions(false);
  };

  /**
   * Selects an existing session and restores its agent and model settings.
   * 
   * @param {string} sessionId - The ID of the session to select.
   */
  const handleSelectSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      const savedAgent = AGENTS.find(a => a.id === session.agentId) || AGENTS[0];
      setActiveAgent(savedAgent);
      setModelId(savedAgent.model); 
    }
  };

  return {
    sessions,
    currentSession,
    currentSessionId,
    messages,
    activeAgent,
    setActiveAgent,
    modelId,
    setModelId,
    isStreaming,
    suggestions,
    isGeneratingSuggestions,
    clearSuggestions,
    handleSendMessage,
    handleEditMessage,
    handleDeleteMessage,
    handleFeedback,
    handleDeleteSession,
    handleClearChat,
    handleExportChat,
    handleNewChat,
    handleSelectSession
  };
};
