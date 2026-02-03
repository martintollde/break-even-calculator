'use client';

import { ArrowUpRight, ArrowDownRight, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScenarioSet, ReverseScenario, ScenarioName } from '@/lib/types';

interface ScenarioComparisonProps {
  scenarios: ScenarioSet;
  selectedScenario: ScenarioName;
  onSelectScenario: (scenario: ScenarioName) => void;
}

/**
 * Formaterar ett belopp i SEK med tusentalsavgränsare
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formaterar procentuell förändring
 */
function formatDeltaPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Delta-indikator med pil och färg
 */
function DeltaIndicator({ value, inverted = false }: { value: number; inverted?: boolean }) {
  if (Math.abs(value) < 0.1) return null;

  const isPositive = inverted ? value < 0 : value >= 0;
  const Icon = value >= 0 ? ArrowUpRight : ArrowDownRight;
  const colorClass = isPositive ? 'text-green-600' : 'text-red-600';

  return (
    <span className={`inline-flex items-center text-xs ${colorClass}`}>
      <Icon className="h-3 w-3" />
      {formatDeltaPercent(value)}
    </span>
  );
}

/**
 * Enskilt scenario-kort
 */
function ScenarioCard({
  scenario,
  isSelected,
  onSelect,
}: {
  scenario: ReverseScenario;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const selectedClasses = isSelected
    ? 'ring-2 ring-blue-500 border-blue-500'
    : 'hover:border-gray-400 dark:hover:border-gray-600';

  const recommendedClasses = scenario.isRecommended && !isSelected
    ? 'border-blue-300 dark:border-blue-700'
    : '';

  return (
    <Card
      className={`cursor-pointer transition-all ${selectedClasses} ${recommendedClasses}`}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{scenario.label}</CardTitle>
          {scenario.isRecommended && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              <Star className="h-3 w-3 mr-1" />
              Rekommenderat
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Reasoning */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          {scenario.reasoning}
        </p>

        {/* Budget */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Budget</span>
          <div className="text-right">
            <span className="font-semibold">{formatCurrency(scenario.recommendedBudget)}</span>
            {scenario.budgetDeltaPercent !== 0 && (
              <div className="mt-0.5">
                <DeltaIndicator value={scenario.budgetDeltaPercent} inverted />
              </div>
            )}
          </div>
        </div>

        {/* Revenue */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Intäkt</span>
          <div className="text-right">
            <span className="font-semibold">{formatCurrency(scenario.expectedRevenue)}</span>
            {scenario.revenueDeltaPercent !== 0 && (
              <div className="mt-0.5">
                <DeltaIndicator value={scenario.revenueDeltaPercent} />
              </div>
            )}
          </div>
        </div>

        {/* ROAS and Profit margin */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <div>
            <div className="text-xs text-muted-foreground">ROAS</div>
            <div className="font-semibold">{scenario.requiredROAS.toFixed(2)}x</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Vinstmarginal</div>
            <div className="font-semibold">{(scenario.achievedProfitMargin * 100).toFixed(0)}%</div>
          </div>
        </div>

        {/* COS */}
        <div className="text-xs text-muted-foreground">
          COS: {scenario.requiredCOS.toFixed(1)}%
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * ScenarioComparison visar tre scenarion för jämförelse.
 * Användaren kan välja ett scenario genom att klicka på kortet.
 */
export function ScenarioComparison({
  scenarios,
  selectedScenario,
  onSelectScenario,
}: ScenarioComparisonProps) {
  const scenarioList: { key: ScenarioName; scenario: ReverseScenario }[] = [
    { key: 'balance', scenario: scenarios.balance },
    { key: 'maxRevenue', scenario: scenarios.maxRevenue },
    { key: 'maxProfit', scenario: scenarios.maxProfit },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Scenariojämförelse
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {scenarioList.map(({ key, scenario }) => (
          <ScenarioCard
            key={key}
            scenario={scenario}
            isSelected={selectedScenario === key}
            onSelect={() => onSelectScenario(key)}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2">
        <div className="flex items-center gap-1">
          <ArrowUpRight className="h-3 w-3 text-green-600" />
          <span>Ökning (positivt)</span>
        </div>
        <div className="flex items-center gap-1">
          <ArrowDownRight className="h-3 w-3 text-red-600" />
          <span>Minskning</span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 text-blue-600" />
          <span>Rekommenderat baserat på dina förutsättningar</span>
        </div>
      </div>
    </div>
  );
}

export default ScenarioComparison;
