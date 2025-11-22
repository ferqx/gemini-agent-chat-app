import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { AgentConfig, Attachment, Message, Role } from "../types";
import { Language } from "../translations";

/**
 * Streams a response from the Gemini API based on the provided agent configuration and chat history.
 * This function handles formatting the history, preparing attachments, and managing the stream loop.
 *
 * @param {AgentConfig} agent - The configuration of the agent being used (model, system instructions).
 * @param {Message[]} history - The chat history to provide context to the model.
 * @param {string} newMessage - The current user message to send.
 * @param {Attachment[]} [attachments=[]] - Optional list of file attachments (images, etc.).
 * @param {function(string): void} onChunk - Callback function invoked when a text chunk is received.
 * @param {function(string): void} onComplete - Callback function invoked when the stream is complete with full text.
 * @param {function(Error): void} onError - Callback function invoked if an error occurs during the API call.
 * @returns {Promise<void>} A promise that resolves when the stream processing initiates (not when it finishes).
 */
export const streamGeminiResponse = async (
  agent: AgentConfig,
  history: Message[],
  newMessage: string,
  attachments: Attachment[] = [],
  onChunk: (text: string) => void,
  onComplete: (fullText: string) => void,
  onError: (error: Error) => void
) => {
  try {
    // Initialize the client per-request with the user's key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // 1. Format History
    // We only send previous messages to maintain context, excluding the current new one which goes in 'contents'
    const previousHistory = history.map(msg => ({
      role: msg.role === Role.USER ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // 2. Construct Current Message Content
    const parts: any[] = [];
    
    // Add attachments if any
    attachments.forEach(att => {
      parts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data
        }
      });
    });

    // Add text
    if (newMessage) {
      parts.push({ text: newMessage });
    }

    // 3. Configure and Call API
    const chat = ai.chats.create({
      model: agent.model,
      history: previousHistory,
      config: {
        systemInstruction: agent.systemInstruction,
      }
    });

    const resultStream = await chat.sendMessageStream({
      message: parts
    });

    let fullText = "";

    for await (const chunk of resultStream) {
      // Type assertion to safe type
      const responseChunk = chunk as GenerateContentResponse;
      const chunkText = responseChunk.text || "";
      fullText += chunkText;
      onChunk(fullText);
    }

    onComplete(fullText);

  } catch (error) {
    console.error("Gemini API Error:", error);
    onError(error instanceof Error ? error : new Error("Unknown Gemini API error"));
  }
};

/**
 * Generates 3 short context-aware follow-up suggestions based on the conversation.
 * Uses Gemini 2.5 Flash for speed and JSON schema for structure.
 */
export const generateChatSuggestions = async (
  history: Message[],
  lastResponse: string,
  language: Language
): Promise<string[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // We only need the last few turns for suggestions to keep it fast and cheap
    const recentContext = history.slice(-4).map(msg => 
      `${msg.role === Role.USER ? 'User' : 'Model'}: ${msg.text}`
    ).join('\n');

    const prompt = `
      Based on the conversation context below and the last model response, provide 3 short, concise, and relevant follow-up questions or commands that the user might want to ask next.
      
      Context:
      ${recentContext}
      
      Last Model Response:
      ${lastResponse}
      
      Requirements:
      1. Responses must be in ${language === 'zh' ? 'Chinese (Simplified)' : 'English'}.
      2. Keep them short (under 10 words).
      3. Ensure they are directly related to the content.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, 3); // Ensure max 3
      }
    }
    return [];
  } catch (error) {
    console.error("Failed to generate suggestions:", error);
    return [];
  }
};