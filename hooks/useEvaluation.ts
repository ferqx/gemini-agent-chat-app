
import { useState, useEffect } from 'react';
import { EvaluationSuite, EvaluationRun, EvaluationCase, AgentConfig, TestResult } from '../types';
import { streamGeminiResponse } from '../services/geminiService';
import { evaluateTestCase } from '../services/evaluationService';

const SUITES_KEY = 'agno_eval_suites';
const RUNS_KEY = 'agno_eval_runs';

export const useEvaluation = () => {
  const [suites, setSuites] = useState<EvaluationSuite[]>([]);
  const [runs, setRuns] = useState<EvaluationRun[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const savedSuites = localStorage.getItem(SUITES_KEY);
    const savedRuns = localStorage.getItem(RUNS_KEY);
    
    if (savedSuites) {
      try { setSuites(JSON.parse(savedSuites)); } catch (e) {}
    }
    if (savedRuns) {
      try { setRuns(JSON.parse(savedRuns)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SUITES_KEY, JSON.stringify(suites));
  }, [suites]);

  useEffect(() => {
    localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
  }, [runs]);

  // --- Suite Management ---

  const createSuite = (name: string, description: string) => {
    const newSuite: EvaluationSuite = {
      id: Date.now().toString(),
      name,
      description,
      cases: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setSuites(prev => [newSuite, ...prev]);
    return newSuite.id;
  };

  const updateSuite = (id: string, updates: Partial<EvaluationSuite>) => {
    setSuites(prev => prev.map(s => s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s));
  };

  const deleteSuite = (id: string) => {
    setSuites(prev => prev.filter(s => s.id !== id));
    // Also delete associated runs
    setRuns(prev => prev.filter(r => r.suiteId !== id));
  };

  const updateSuiteCases = (suiteId: string, cases: EvaluationCase[]) => {
    setSuites(prev => prev.map(s => s.id === suiteId ? { ...s, cases, updatedAt: Date.now() } : s));
  };

  // --- Runner Logic ---

  const runSuite = async (suiteId: string, agent: AgentConfig) => {
    const suite = suites.find(s => s.id === suiteId);
    if (!suite || suite.cases.length === 0) return;

    setIsRunning(true);
    const results: TestResult[] = [];
    
    // We snapshot the Agent Name and Description/Version in case the Agent is deleted later.
    const runId = Date.now().toString();
    
    // Process sequentially to avoid rate limits (in a real app, might want a pool)
    for (const testCase of suite.cases) {
      if (!testCase.input.trim()) continue;

      try {
        let actualOutput = "";
        
        // 1. Generate Response (using non-streaming wrapper around the stream service for simplicity)
        await new Promise<void>((resolve) => {
          streamGeminiResponse(
            agent, // Use provided agent config
            [], // No history
            testCase.input,
            [],
            () => {}, 
            (fullText) => {
              actualOutput = fullText;
              resolve();
            },
            (err) => {
              actualOutput = "Error: " + err.message;
              resolve();
            }
          );
        });

        // 2. Judge Response
        const evalResult = await evaluateTestCase(
          testCase.input,
          actualOutput,
          testCase.expectedOutput,
          agent.systemInstruction // The logic uses the system instruction to judge relevance
        );
        
        evalResult.testCaseId = testCase.id;
        results.push(evalResult);

      } catch (e) {
        console.error("Run error", e);
      }
    }

    // Calculate Overall Score
    const totalScore = results.reduce((acc, r) => acc + r.score, 0);
    const avgScore = results.length > 0 ? Math.round(totalScore / results.length) : 0;

    const newRun: EvaluationRun = {
      id: runId,
      suiteId,
      suiteNameSnapshot: suite.name,
      agentId: agent.id,
      agentNameSnapshot: agent.name,
      agentVersionSnapshot: agent.currentVersion || 1,
      timestamp: Date.now(),
      overallScore: avgScore,
      results
    };

    setRuns(prev => [newRun, ...prev]);
    setIsRunning(false);
  };

  const getRunsBySuite = (suiteId: string) => {
    return runs.filter(r => r.suiteId === suiteId).sort((a, b) => b.timestamp - a.timestamp);
  };

  return {
    suites,
    createSuite,
    updateSuite,
    deleteSuite,
    updateSuiteCases,
    runSuite,
    getRunsBySuite,
    isRunning,
    runs // exposing all runs if needed
  };
};
