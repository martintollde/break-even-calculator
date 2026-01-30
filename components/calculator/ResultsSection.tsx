'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { CalculatorOutput, ViewMode } from '@/lib/types';
import { formatNumber, formatCurrency } from '@/lib/export';
import { RoasZones } from './RoasZones';
import { Assumptions } from './Assumptions';
import { InfoTooltip } from './InfoTooltip';
import { tooltips } from '@/lib/defaults';

interface ResultsSectionProps {
  outputs: CalculatorOutput;
}

const viewModeExplanation: Record<ViewMode, string> = {
  roas: 'ROAS (Return on Ad Spend) visar hur mycket intäkt per spenderad annonskrona. Högre är bättre. ROAS 4.0 = 4 kr tillbaka per 1 kr spend.',
  cos: 'COS (Cost of Sale) visar annonskostnad som andel av intäkten. Lägre är bättre. COS 25% = 25 öre i annonskostnad per intjänad krona.',
};

const conversionTable = [
  { roas: 2.0, cos: 50.0 },
  { roas: 2.5, cos: 40.0 },
  { roas: 3.0, cos: 33.3 },
  { roas: 4.0, cos: 25.0 },
  { roas: 5.0, cos: 20.0 },
  { roas: 8.0, cos: 12.5 },
  { roas: 10.0, cos: 10.0 },
];

function ConfidenceBar({ level }: { level: 'low' | 'medium' | 'high' }) {
  const segments = level === 'high' ? 5 : level === 'medium' ? 3 : 1;
  const label = level === 'high' ? 'Hög' : level === 'medium' ? 'Medium' : 'Låg';
  const color = level === 'high' ? 'bg-green-500' : level === 'medium' ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Precision:</span>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-3 w-3 rounded-sm ${i < segments ? color : 'bg-muted'}`}
          />
        ))}
      </div>
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}

function ResultCard({
  title,
  value,
  subtitle,
  tooltip,
  highlight,
}: {
  title: string;
  value: string;
  subtitle?: string;
  tooltip?: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : ''}>
      <CardContent className="p-4 text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
          {tooltip && <InfoTooltip text={tooltip} />}
        </div>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
      </CardContent>
    </Card>
  );
}

export function ResultsSection({ outputs }: ResultsSectionProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('roas');
  const isValid = isFinite(outputs.breakEvenRoas) && outputs.netProfitPerOrder > 0;

  if (!isValid) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-6 text-center">
        <p className="text-red-700 dark:text-red-400 font-medium">
          Negativ nettovinst per order
        </p>
        <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
          Med dessa värden gör ni förlust på varje order redan innan annonskostnad.
          Kontrollera era marginaler och kostnader.
        </p>
      </div>
    );
  }

  const isRoas = viewMode === 'roas';

  return (
    <div className="space-y-6">
      {/* Toggle + Confidence */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Visa som:</span>
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(val) => { if (val) setViewMode(val as ViewMode); }}
            className="bg-muted rounded-md"
          >
            <ToggleGroupItem value="roas" className="text-xs px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm">
              ROAS
            </ToggleGroupItem>
            <ToggleGroupItem value="cos" className="text-xs px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm">
              COS %
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <ConfidenceBar level={outputs.confidenceLevel} />
      </div>

      {/* Explanation */}
      <p className="text-sm text-muted-foreground">
        {viewModeExplanation[viewMode]}
      </p>

      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isRoas ? (
          <>
            <ResultCard
              title="Break-even ROAS"
              value={`${formatNumber(outputs.breakEvenRoas)}x`}
              subtitle="Minsta ROAS för lönsamhet"
              tooltip={tooltips.breakEvenRoas}
              highlight
            />
            <ResultCard
              title="Target ROAS"
              value={`${formatNumber(outputs.targetRoas)}x`}
              subtitle={`${outputs.desiredProfitMargin}% vinstmarginal`}
              tooltip={tooltips.targetRoas}
            />
          </>
        ) : (
          <>
            <ResultCard
              title="Break-even COS"
              value={`${formatNumber(outputs.breakEvenCos)}%`}
              subtitle="Max COS för lönsamhet"
              tooltip={tooltips.breakEvenCos}
              highlight
            />
            <ResultCard
              title="Target COS"
              value={`${formatNumber(outputs.targetCos)}%`}
              subtitle={`${outputs.desiredProfitMargin}% vinstmarginal`}
              tooltip={tooltips.targetCos}
            />
          </>
        )}
        <ResultCard
          title="Max CPA"
          value={formatCurrency(outputs.maxCpa)}
          tooltip={tooltips.maxCpa}
        />
      </div>

      {/* Zones */}
      <RoasZones
        breakEvenRoas={outputs.breakEvenRoas}
        targetRoas={outputs.targetRoas}
        breakEvenCos={outputs.breakEvenCos}
        targetCos={outputs.targetCos}
        viewMode={viewMode}
      />

      {/* LTV section */}
      <div className="rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-2">
        <h4 className="text-sm font-semibold flex items-center gap-1.5">
          LTV-justerat
          <span className="text-xs font-normal text-muted-foreground">(om kund handlar igen)</span>
          <InfoTooltip text={tooltips.maxCpaLtv} />
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Max CPA med LTV</div>
            <div className="text-xl font-bold">{formatCurrency(outputs.maxCpaWithLtv)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Break-even {isRoas ? 'ROAS' : 'COS'} med LTV</div>
            <div className="text-xl font-bold">
              {isRoas
                ? `${formatNumber(outputs.breakEvenRoasWithLtv)}x`
                : `${formatNumber(isFinite(outputs.breakEvenRoasWithLtv) ? (1 / outputs.breakEvenRoasWithLtv) * 100 : 0)}%`
              }
            </div>
          </div>
        </div>
      </div>

      {/* Conversion table */}
      <Accordion type="single" collapsible>
        <AccordionItem value="conversion" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-medium text-muted-foreground hover:no-underline">
            ROAS / COS referenstabell
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-7 gap-2 text-center text-sm">
              {conversionTable.map((row) => (
                <div key={row.roas} className="rounded-md border p-2">
                  <div className="font-semibold">{row.roas}x</div>
                  <div className="text-xs text-muted-foreground">{row.cos}%</div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>ROAS</span>
              <span>COS</span>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Assumptions */}
      <Assumptions assumptions={outputs.assumptions} />
    </div>
  );
}
