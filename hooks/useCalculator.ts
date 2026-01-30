'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { CalculatorInput, CalculatorOutput, Industry, Scenario } from '@/lib/types';
import { calculateBreakEven } from '@/lib/calculations';
import { parseShareUrl } from '@/lib/export';

const defaultInputs: CalculatorInput = {
  aov: 0,
  industry: 'ecommerce',
};

export function useCalculator() {
  const [inputs, setInputs] = useState<CalculatorInput>(defaultInputs);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Parse URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const parsed = parseShareUrl(params);
    if (parsed && parsed.aov) {
      setInputs({ ...defaultInputs, ...parsed } as CalculatorInput);
    }
    setInitialized(true);
  }, []);

  const isValid = inputs.aov > 0;

  const outputs: CalculatorOutput | null = useMemo(() => {
    if (!isValid) return null;
    return calculateBreakEven(inputs);
  }, [inputs, isValid]);

  const updateInput = useCallback(<K extends keyof CalculatorInput>(
    key: K,
    value: CalculatorInput[K],
  ) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearOptionalInput = useCallback((key: keyof CalculatorInput) => {
    setInputs(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const saveScenario = useCallback((name: string) => {
    if (!outputs) return;
    const scenario: Scenario = {
      id: Date.now().toString(),
      name,
      inputs: { ...inputs },
      outputs,
    };
    setScenarios(prev => [...prev.slice(-2), scenario]); // max 3
  }, [inputs, outputs]);

  const removeScenario = useCallback((id: string) => {
    setScenarios(prev => prev.filter(s => s.id !== id));
  }, []);

  const loadScenario = useCallback((scenario: Scenario) => {
    setInputs(scenario.inputs);
  }, []);

  return {
    inputs,
    outputs,
    isValid,
    initialized,
    updateInput,
    clearOptionalInput,
    scenarios,
    saveScenario,
    removeScenario,
    loadScenario,
  };
}
