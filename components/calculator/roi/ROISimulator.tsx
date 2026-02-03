'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { BarChart3, TrendingUp, Calendar, Percent } from 'lucide-react';
import { ReverseInputs, ReverseOutputs, ScenarioName, ROICase } from '@/lib/types';
import { simulateROI, getDefaultConfig } from '@/lib/roi-simulator';
import { RevenueComparisonChart } from './RevenueComparisonChart';
import { CumulativeProfitChart } from './CumulativeProfitChart';

interface ROISimulatorProps {
  reverseInputs: ReverseInputs;
  reverseOutputs: ReverseOutputs | null;
  selectedScenario: ScenarioName;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const caseLabels: Record<ROICase, string> = {
  worst: 'Pessimistiskt',
  expected: 'Förväntat',
  best: 'Optimistiskt',
};

export function ROISimulator({ reverseInputs, reverseOutputs, selectedScenario }: ROISimulatorProps) {
  const [roiCase, setRoiCase] = useState<ROICase>('expected');

  const simulation = useMemo(() => {
    if (!reverseOutputs) return null;

    const scenario = reverseOutputs.scenarios[selectedScenario];
    const config = getDefaultConfig(roiCase);
    return simulateROI(reverseInputs, scenario, config);
  }, [reverseInputs, reverseOutputs, selectedScenario, roiCase]);

  if (!reverseOutputs) {
    return (
      <div className="rounded-lg border bg-muted/50 p-8 text-center space-y-2">
        <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground" />
        <p className="text-muted-foreground">
          Fyll i Bakåt-kalkylatorn först och tryck &quot;Beräkna krav&quot; för att kunna simulera ROI.
        </p>
      </div>
    );
  }

  if (!simulation) return null;

  return (
    <div className="space-y-6">
      {/* Case Toggle */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-medium text-muted-foreground">Scenario</p>
        <ToggleGroup
          type="single"
          value={roiCase}
          onValueChange={(value) => {
            if (value) setRoiCase(value as ROICase);
          }}
          className="justify-center"
        >
          <ToggleGroupItem value="worst" aria-label="Pessimistiskt" className="text-xs sm:text-sm">
            {caseLabels.worst}
          </ToggleGroupItem>
          <ToggleGroupItem value="expected" aria-label="Förväntat" className="text-xs sm:text-sm">
            {caseLabels.expected}
          </ToggleGroupItem>
          <ToggleGroupItem value="best" aria-label="Optimistiskt" className="text-xs sm:text-sm">
            {caseLabels.best}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <p className="text-xs text-muted-foreground">Intäktsökning</p>
            </div>
            <p className="text-lg font-bold">{formatCurrency(simulation.totalRevenueDelta)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-green-600" />
              <p className="text-xs text-muted-foreground">Vinstökning</p>
            </div>
            <p className="text-lg font-bold">{formatCurrency(simulation.totalProfitDelta)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-orange-600" />
              <p className="text-xs text-muted-foreground">Break-even</p>
            </div>
            <p className="text-lg font-bold">
              {simulation.breakEvenMonth <= 12
                ? `Månad ${simulation.breakEvenMonth}`
                : '> 12 mån'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Percent className="h-4 w-4 text-purple-600" />
              <p className="text-xs text-muted-foreground">12-mån ROI</p>
            </div>
            <p className="text-lg font-bold">{simulation.roi12Month.toFixed(0)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Comparison Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Månadsintäkter: Om vi agerar vs Om vi väntar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueComparisonChart
            ifWeDo={simulation.ifWeDo}
            ifWeWait={simulation.ifWeWait}
          />
        </CardContent>
      </Card>

      {/* Cumulative Profit Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Kumulativ vinst (paid media)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CumulativeProfitChart
            ifWeDo={simulation.ifWeDo}
            breakEvenMonth={simulation.breakEvenMonth}
          />
        </CardContent>
      </Card>
    </div>
  );
}
