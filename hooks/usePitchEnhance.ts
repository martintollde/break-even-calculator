'use client';

import { useState, useCallback } from 'react';
import { PitchScript, PitchEnhanceRequest } from '@/lib/types';

interface UsePitchEnhanceReturn {
  enhance: (request: PitchEnhanceRequest) => void;
  isLoading: boolean;
  error: string | null;
  enhancedScript: PitchScript | null;
}

export function usePitchEnhance(): UsePitchEnhanceReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enhancedScript, setEnhancedScript] = useState<PitchScript | null>(null);

  const enhance = useCallback(async (request: PitchEnhanceRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/pitch/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Server error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream available');
      }

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
      }

      // Parse the complete response as JSON (the API returns the full enhanced script)
      const parsed = JSON.parse(fullText) as PitchScript;
      setEnhancedScript(parsed);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunde inte förbättra scriptet';
      if (message.includes('API-nyckel') || message.includes('ANTHROPIC_API_KEY')) {
        setError('AI-förbättring kräver en API-nyckel. Kontakta administratören.');
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { enhance, isLoading, error, enhancedScript };
}
