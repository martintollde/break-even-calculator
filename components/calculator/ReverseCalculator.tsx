'use client';

import { useState } from 'react';
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
import { CalculatorInput, ReverseOutputs, ScenarioName, Industry, industryLabels } from '@/lib/types';
import { industryDefaults } from '@/lib/defaults';
import { EconomicsInputs } from './shared/EconomicsInputs';
import { StatusIndicator } from './StatusIndicator';
import { ScenarioComparison } from './ScenarioComparison';
import { InfoTooltip } from './InfoTooltip';

// ============================================
// DEFAULT VALUES
// ============================================

export const defaultEconomics: CalculatorInput = {
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
// MAIN COMPONENT (CONTROLLED)
// ============================================

interface ReverseCalculatorProps {
  revenueTarget: number;
  mediaBudget: number;
  profitMarginGoal: number;
  economics: CalculatorInput;
  outputs: ReverseOutputs | null;
  selectedScenario: ScenarioName;
  onRevenueTargetChange: (value: number) => void;
  onMediaBudgetChange: (value: number) => void;
  onProfitMarginGoalChange: (value: number) => void;
  onEconomicsUpdate: <K extends keyof CalculatorInput>(key: K, value: CalculatorInput[K]) => void;
  onEconomicsClear: (key: keyof CalculatorInput) => void;
  onCalculate: () => void;
  onScenarioSelect: (scenario: ScenarioName) => void;
  error: string | null;
}

/**
 * ReverseCalculator - Bakåtkalkylator för att beräkna krav utifrån mål.
 *
 * Now a controlled component - all state is managed by parent.
 */
export function ReverseCalculator({
  revenueTarget,
  mediaBudget,
  profitMarginGoal,
  economics,
  outputs,
  selectedScenario,
  onRevenueTargetChange,
  onMediaBudgetChange,
  onProfitMarginGoalChange,
  onEconomicsUpdate,
  onEconomicsClear,
  onCalculate,
  onScenarioSelect,
  error,
}: ReverseCalculatorProps) {
  // UI state (kept local - not needed by siblings)
  const [isEconomicsOpen, setIsEconomicsOpen] = useState<boolean>(false);

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
              onValueChange={(val) => onEconomicsUpdate('industry', val as Industry)}
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
              onChange={onRevenueTargetChange}
              suffix="SEK"
              placeholder="t.ex. 10000000"
              min={0}
              step={100000}
            />

            <GoalInput
              label="Mediabudget"
              tooltip="Total budget för paid media under perioden."
              value={mediaBudget}
              onChange={onMediaBudgetChange}
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
            onChange={onProfitMarginGoalChange}
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
                onClick={() => onProfitMarginGoalChange(val)}
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
                onUpdate={onEconomicsUpdate}
                onClear={onEconomicsClear}
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
        onClick={onCalculate}
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
              onSelectScenario={onScenarioSelect}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default ReverseCalculator;
