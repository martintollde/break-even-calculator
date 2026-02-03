'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Copy, Share2, Check, Calculator, TrendingUp } from 'lucide-react';
import { useCalculator } from '@/hooks/useCalculator';
import { generateShareUrl, generateCopyText } from '@/lib/export';
import { EconomicsInputs } from './shared/EconomicsInputs';
import { ResultsSection } from './ResultsSection';
import { ScenarioCompare } from './ScenarioCompare';

/**
 * ForwardCalculator - Framåtkalkylator för break-even ROAS.
 *
 * Användaren anger ekonomiska parametrar och ser:
 * - Break-even ROAS
 * - Mål-ROAS med önskad vinstmarginal
 * - COS-motsvarigheter
 * - Detaljerad kostnadsuppdelning
 */
export function ForwardCalculator() {
  const {
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
  } = useCalculator();

  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!outputs) return;
    const text = generateCopyText(inputs, outputs);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [inputs, outputs]);

  const handleShare = useCallback(async () => {
    const url = generateShareUrl(inputs);
    await navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }, [inputs]);

  if (!initialized) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Laddar...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Ekonomiska parametrar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EconomicsInputs
            inputs={inputs}
            onUpdate={updateInput}
            onClear={clearOptionalInput}
            showCalculateButton={false}
          />
        </CardContent>
      </Card>

      {/* Results */}
      {isValid && outputs ? (
        <>
          <Separator />

          <div className="space-y-6">
            <h2 className="text-xl font-bold">Resultat</h2>
            <ResultsSection outputs={outputs} />

            {/* Export buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? 'Kopierat!' : 'Kopiera'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                {linkCopied ? <Check className="h-4 w-4 mr-1" /> : <Share2 className="h-4 w-4 mr-1" />}
                {linkCopied ? 'Länk kopierad!' : 'Dela länk'}
              </Button>
            </div>

            <Separator />

            {/* Scenario comparison */}
            <ScenarioCompare
              scenarios={scenarios}
              canSave={!!outputs}
              onSave={saveScenario}
              onRemove={removeScenario}
              onLoad={loadScenario}
            />
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Calculator className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Ange AOV för att se resultat</p>
            <p className="text-sm text-muted-foreground mt-1">
              Fyll i snittordervärdet ovan för att beräkna break-even ROAS
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ForwardCalculator;
