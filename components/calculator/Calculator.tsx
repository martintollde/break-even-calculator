'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Copy, Share2, HelpCircle, Check } from 'lucide-react';
import { useCalculator } from '@/hooks/useCalculator';
import { generateShareUrl, generateCopyText } from '@/lib/export';
import { InputSection } from './InputSection';
import { ResultsSection } from './ResultsSection';
import { ScenarioCompare } from './ScenarioCompare';

export function Calculator() {
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
  const [showHelp, setShowHelp] = useState(false);

  const handleCopy = async () => {
    if (!outputs) return;
    const text = generateCopyText(inputs, outputs);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const url = generateShareUrl(inputs);
    await navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (!initialized) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            Laddar...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold tracking-tight">
            Break-even ROAS Calculator
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHelp(!showHelp)}
            className="text-muted-foreground"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </CardHeader>

        {showHelp && (
          <div className="mx-6 mb-4 rounded-lg border bg-muted/50 p-4 text-sm space-y-2">
            <p className="font-medium">Hur fungerar kalkylatorn?</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Välj bransch - detta sätter branschsnitt som standardvärden</li>
              <li>Ange snittordervärde (AOV) - det enda obligatoriska fältet</li>
              <li>Lägg till egna siffror för högre precision (produktkostnad, marginal, etc.)</li>
              <li>Se resultat uppdateras i realtid</li>
            </ol>
            <p className="text-muted-foreground">
              Ju fler egna värden du anger, desto högre precision. Värden som saknas fylls i
              med branschsnitt (markeras tydligt i resultatet).
            </p>
          </div>
        )}

        <CardContent className="space-y-6">
          <InputSection
            inputs={inputs}
            onUpdate={updateInput}
            onClear={clearOptionalInput}
          />

          <Separator />

          {/* Results */}
          {isValid && outputs ? (
            <>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Resultat
                </h3>
                <ResultsSection outputs={outputs} />
              </div>

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
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-lg font-medium">Ange AOV för att se resultat</p>
              <p className="text-sm mt-1">Fyll i snittordervärdet ovan för att beräkna break-even ROAS</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
