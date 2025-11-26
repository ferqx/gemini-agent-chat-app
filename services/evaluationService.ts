import { GoogleGenAI, Type } from "@google/genai";
import { TestResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const evaluateAgentPerformance = async () => ({ qualityScore: 85, interactionCount: 12, satisfactionRate: 92 });

export const evaluateTestCase = async (
  input: string,
  actualOutput: string,
  expectedOutput: string,
  systemInstruction?: string
): Promise<TestResult> => {
  try {
    const prompt = `
      You are an expert AI evaluator.
      
      System Instruction: ${systemInstruction || 'None'}
      User Input: ${input}
      Actual Output: ${actualOutput}
      Expected Output (Golden): ${expectedOutput}
      
      Compare the Actual Output with the Expected Output.
      Determine if the Actual Output accurately answers the User Input and matches the intent/facts of the Expected Output.
      
      Return a JSON object with:
      - pass: boolean (true if correct/acceptable)
      - score: number (0 to 100)
      - reasoning: string (explanation of the score)
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pass: { type: Type.BOOLEAN },
            score: { type: Type.NUMBER },
            reasoning: { type: Type.STRING }
          },
          required: ['pass', 'score', 'reasoning']
        }
      }
    });

    const json = JSON.parse(response.text || '{}');

    return {
      pass: json.pass ?? false,
      score: json.score ?? 0,
      actualOutput: actualOutput,
      reasoning: json.reasoning ?? "Evaluation parsed with missing fields."
    };
  } catch (e) {
    console.error("Evaluation failed", e);
    return {
      pass: false,
      score: 0,
      actualOutput: actualOutput,
      reasoning: "Evaluation failed due to API error."
    };
  }
};