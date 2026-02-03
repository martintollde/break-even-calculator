'use client';

import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ReverseOutputs, GoalStatus } from '@/lib/types';

interface StatusIndicatorProps {
  outputs: ReverseOutputs;
}

/**
 * Konfiguration för varje status
 */
const statusConfig: Record<GoalStatus, {
  icon: typeof CheckCircle2;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}> = {
  achievable: {
    icon: CheckCircle2,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-200 dark:border-green-800',
    textColor: 'text-green-800 dark:text-green-200',
  },
  tight: {
    icon: AlertTriangle,
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    textColor: 'text-orange-800 dark:text-orange-200',
  },
  impossible: {
    icon: XCircle,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-red-200 dark:border-red-800',
    textColor: 'text-red-800 dark:text-red-200',
  },
};

/**
 * Formaterar ROAS-värde för visning
 */
function formatRoas(value: number): string {
  if (!isFinite(value)) return '∞';
  return value.toFixed(2) + 'x';
}

/**
 * Formaterar COS-värde för visning
 */
function formatCos(value: number): string {
  if (!isFinite(value) || value <= 0) return '0%';
  return value.toFixed(1) + '%';
}

/**
 * Visuell jämförelseindikator för ROAS-värden
 */
function RoasComparisonBar({
  breakEven,
  target,
  required,
}: {
  breakEven: number;
  target: number;
  required: number;
}) {
  // Beräkna positioner på en skala 0-100
  // Vi använder max av alla värden + 20% som referens
  const maxValue = Math.max(breakEven, target, required) * 1.2;
  const minValue = Math.min(breakEven, target, required) * 0.8;
  const range = maxValue - minValue;

  const getPosition = (value: number) => {
    if (!isFinite(value) || range <= 0) return 50;
    return ((value - minValue) / range) * 100;
  };

  const breakEvenPos = getPosition(breakEven);
  const targetPos = getPosition(target);
  const requiredPos = getPosition(required);

  return (
    <div className="mt-4">
      <div className="text-xs text-muted-foreground mb-2">ROAS-jämförelse</div>

      {/* Bar container */}
      <div className="relative h-8 bg-gradient-to-r from-red-200 via-orange-200 to-green-200 dark:from-red-900/30 dark:via-orange-900/30 dark:to-green-900/30 rounded-lg">

        {/* Break-even marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-600"
          style={{ left: `${breakEvenPos}%` }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-600 rounded-full" />
        </div>

        {/* Target marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-orange-600"
          style={{ left: `${targetPos}%` }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-orange-600 rounded-full" />
        </div>

        {/* Required marker */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-blue-600"
          style={{ left: `${requiredPos}%` }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-600 rounded-full border-2 border-white dark:border-gray-800" />
        </div>
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-600 rounded-full" />
          <span className="text-muted-foreground">Break-even ({formatRoas(breakEven)})</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-orange-600 rounded-full" />
          <span className="text-muted-foreground">Target ({formatRoas(target)})</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-600 rounded-full" />
          <span className="font-medium">Krav ({formatRoas(required)})</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Short recommendation label per status.
 */
const statusLabels: Record<GoalStatus, string> = {
  achievable: 'Lönsamhet möjlig',
  tight: 'Möjligt men kräver optimering',
  impossible: 'Underfinansierat / för högt mål',
};

/**
 * StatusIndicator visar resultatstatus för bakåt-kalkylatorn.
 * Inkluderar status-ikon, meddelande, detaljer och ROAS-jämförelse.
 */
export function StatusIndicator({ outputs }: StatusIndicatorProps) {
  const config = statusConfig[outputs.status];
  const Icon = config.icon;

  return (
    <div className="space-y-4">
      {/* Status header */}
      <Card className={`${config.bgColor} ${config.borderColor} border`}>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Icon className={`h-6 w-6 ${config.iconColor} flex-shrink-0 mt-0.5`} />
            <div>
              <h3 className={`font-semibold text-lg ${config.textColor}`}>
                {outputs.statusMessage}
              </h3>
              <p className={`text-xs mt-1 ${config.textColor} opacity-80`}>
                {statusLabels[outputs.status]}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status details */}
      <Alert className={`${config.bgColor} ${config.borderColor}`}>
        <AlertDescription className={`${config.textColor} text-sm`}>
          {outputs.statusDetails}
        </AlertDescription>
      </Alert>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Krävd ROAS
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {formatRoas(outputs.requiredROAS)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              COS: {formatCos(outputs.requiredCOS)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Break-even ROAS
            </div>
            <div className="text-2xl font-bold">
              {formatRoas(outputs.breakEvenROAS)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Minimum för lönsamhet
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual comparison bar */}
      <RoasComparisonBar
        breakEven={outputs.breakEvenROAS}
        target={outputs.targetROAS}
        required={outputs.requiredROAS}
      />
    </div>
  );
}

export default StatusIndicator;
