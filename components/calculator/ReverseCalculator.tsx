'use client';

import { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalculatorInput, ReverseInputs, ReverseOutputs, ScenarioName, Industry, industryLabels } from '@/lib/types';
import { calculateReverse } from '@/lib/calculations';
import { industryDefaults } from '@/lib/defaults';
import { EconomicsInputs } from './shared/EconomicsInputs';
import { StatusIndicator } from './StatusIndicator';
import { ScenarioComparison } from './ScenarioComparison';
import { InfoTooltip } from './InfoTooltip';

// ============================================
// DEFAULT VALUES
// ============================================

const defaultEconomics: CalculatorInput = {
  aov: 800,
  industry: 'ecommerce',
};

// ============================================
// NUMERIC INPUT FOR GOALS
// ============================================

interface GoalInputProps {
  label: string;
  tooltip: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

function GoalInput({
  label,
  tooltip,
  value,
  onChange,
  suffix,
  placeholder,
  min,
  max,
  step = 1,
}: GoalInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseFloat(e.target.value);
    if (!isNaN(num)) {
      onChange(num);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center">
        <Label className="text-sm font-medium">{label}</Label>
        <InfoTooltip text={tooltip} />
      </div>
      <div className="relative">
        <Input
          type="number"
          value={value || ''}
          onChange={handleChange}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          className={suffix ? 'pr-16' : ''}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * ReverseCalculator - Bakåtkalkylator för att beräkna krav utifrån mål.
 *
 * Användaren anger:
 * - Intäktsmål (SEK)
 * - Mediabudget (SEK)
 * - Önskad vinstmarginal (%)
 * - Ekonomiska parametrar
 *
 * Kalkylatorn beräknar:
 * - Krävd ROAS
 * - Status (achievable/tight/impossible)
 * - Tre scenarion med olika strategier
 */
export function ReverseCalculator() {
  // State för affärsmål
  const [revenueTarget, setRevenueTarget] = useState<number>(10000000);
  const [mediaBudget, setMediaBudget] = useState<number>(1000000);
  const [profitMarginGoal, setProfitMarginGoal] = useState<number>(20);

  // State för ekonomi
  const [economics, setEconomics] = useState<CalculatorInput>(defaultEconomics);

  // State för resultat
  const [outputs, setOutputs] = useState<ReverseOutputs | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioName>('balance');

  // UI state
  const [isEconomicsOpen, setIsEconomicsOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Handlers för ekonomi
  const handleUpdateEconomics = useCallback(<K extends keyof CalculatorInput>(
    key: K,
    value: CalculatorInput[K],
  ) => {
    setEconomics(prev => ({ ...prev, [key]: value }));
    // Rensa resultat när ekonomi ändras
    setOutputs(null);
  }, []);

  const handleClearEconomics = useCallback((key: keyof CalculatorInput) => {
    setEconomics(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setOutputs(null);
  }, []);

  // Beräkna
  const handleCalculate = useCallback(() => {
    setError(null);

    try {
      // Validera indata
      if (revenueTarget <= 0) {
        setError('Intäktsmålet måste vara större än 0');
        return;
      }
      if (mediaBudget <= 0) {
        setError('Mediabudgeten måste vara större än 0');
        return;
      }
      if (profitMarginGoal < 0 || profitMarginGoal > 90) {
        setError('Vinstmarginalen måste vara mellan 0 och 90%');
        return;
      }
      if (!economics.aov || economics.aov <= 0) {
        setError('AOV måste vara större än 0');
        return;
      }

      const inputs: ReverseInputs = {
        revenueTarget,
        mediaBudget,
        profitMarginGoal: profitMarginGoal / 100, // Konvertera till decimal
        economics,
      };

      const result = calculateReverse(inputs);
      setOutputs(result);

      // Välj det rekommenderade scenariot automatiskt
      if (result.scenarios.balance.isRecommended) {
        setSelectedScenario('balance');
      } else if (result.scenarios.maxProfit.isRecommended) {
        setSelectedScenario('maxProfit');
      } else if (result.scenarios.maxRevenue.isRecommended) {
        setSelectedScenario('maxRevenue');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod vid beräkning');
    }
  }, [revenueTarget, mediaBudget, profitMarginGoal, economics]);

  return (
    <div className="space-y-6">
      {/* Goals Input Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Affärsmål
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Industry selector */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Bransch</Label>
            <Select
              value={economics.industry}
              onValueChange={(val) => handleUpdateEconomics('industry', val as Industry)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Välj bransch" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(industryLabels) as Industry[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {industryLabels[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Goal inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GoalInput
              label="Intäktsmål"
              tooltip="Önskad total omsättning från paid media under perioden."
              value={revenueTarget}
              onChange={(val) => { setRevenueTarget(val); setOutputs(null); }}
              suffix="SEK"
              placeholder="t.ex. 10000000"
              min={0}
              step={100000}
            />

            <GoalInput
              label="Mediabudget"
              tooltip="Total budget för paid media under perioden."
              value={mediaBudget}
              onChange={(val) => { setMediaBudget(val); setOutputs(null); }}
              suffix="SEK"
              placeholder="t.ex. 1000000"
              min={0}
              step={10000}
            />
          </div>

          <GoalInput
            label="Önskad vinstmarginal"
            tooltip="Andel av nettovinsten som ska behållas efter annonskostnad. 20% är ett vanligt mål."
            value={profitMarginGoal}
            onChange={(val) => { setProfitMarginGoal(val); setOutputs(null); }}
            suffix="%"
            placeholder="t.ex. 20"
            min={0}
            max={90}
            step={5}
          />

          {/* Quick-select profit margin buttons */}
          <div className="flex gap-2">
            {[10, 15, 20, 25, 30].map(val => (
              <Button
                key={val}
                type="button"
                variant={profitMarginGoal === val ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => { setProfitMarginGoal(val); setOutputs(null); }}
              >
                {val}%
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Economics Section (Collapsible) */}
      <Collapsible open={isEconomicsOpen} onOpenChange={setIsEconomicsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                  Ekonomiska parametrar
                </CardTitle>
                {isEconomicsOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              {!isEconomicsOpen && (
                <p className="text-sm text-muted-foreground mt-1">
                  AOV: {economics.aov.toLocaleString('sv-SE')} SEK
                  {economics.grossMargin && ` • Marginal: ${economics.grossMargin}%`}
                  {!economics.grossMargin && ` • Marginal: ${(industryDefaults[economics.industry].margin * 100).toFixed(0)}% (branschsnitt)`}
                </p>
              )}
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <EconomicsInputs
                inputs={economics}
                onUpdate={handleUpdateEconomics}
                onClear={handleClearEconomics}
                showCalculateButton={false}
                compact={true}
                showProfitMargin={false}
              />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Calculate Button */}
      <Button
        size="lg"
        className="w-full"
        onClick={handleCalculate}
        disabled={!economics.aov || economics.aov <= 0 || revenueTarget <= 0 || mediaBudget <= 0}
      >
        <Calculator className="h-4 w-4 mr-2" />
        Beräkna krav
      </Button>

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-4 text-center">
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {outputs && (
        <>
          <Separator />

          <div className="space-y-6">
            <h2 className="text-xl font-bold">Resultat</h2>

            {/* Status Indicator */}
            <StatusIndicator outputs={outputs} />

            <Separator />

            {/* Scenario Comparison */}
            <ScenarioComparison
              scenarios={outputs.scenarios}
              selectedScenario={selectedScenario}
              onSelectScenario={setSelectedScenario}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default ReverseCalculator;
