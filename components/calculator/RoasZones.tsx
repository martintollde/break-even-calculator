'use client';

import { ViewMode } from '@/lib/types';
import { formatNumber } from '@/lib/export';

interface RoasZonesProps {
  breakEvenRoas: number;
  targetRoas: number;
  breakEvenCos: number;
  targetCos: number;
  viewMode: ViewMode;
}

export function RoasZones({ breakEvenRoas, targetRoas, breakEvenCos, targetCos, viewMode }: RoasZonesProps) {
  if (!isFinite(breakEvenRoas)) return null;

  if (viewMode === 'cos') {
    return (
      <div className="rounded-lg border bg-card p-4">
        <h4 className="text-sm font-semibold text-center mb-4 uppercase tracking-wider text-muted-foreground">
          COS-zoner
        </h4>
        <div className="flex rounded-lg overflow-hidden h-12 text-sm font-medium">
          <div className="flex-1 bg-green-100 dark:bg-green-950 border-r border-white/20 flex flex-col items-center justify-center text-green-700 dark:text-green-400">
            <span className="text-xs uppercase">Lönsamt</span>
            <span className="font-bold">&lt; {formatNumber(targetCos)}%</span>
          </div>
          <div className="flex-1 bg-yellow-100 dark:bg-yellow-950 border-r border-white/20 flex flex-col items-center justify-center text-yellow-700 dark:text-yellow-500">
            <span className="text-xs uppercase">Break-even</span>
            <span className="font-bold">{formatNumber(targetCos)}% – {formatNumber(breakEvenCos)}%</span>
          </div>
          <div className="flex-1 bg-red-100 dark:bg-red-950 flex flex-col items-center justify-center text-red-700 dark:text-red-400">
            <span className="text-xs uppercase">Förlust</span>
            <span className="font-bold">&gt; {formatNumber(breakEvenCos)}%</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <h4 className="text-sm font-semibold text-center mb-4 uppercase tracking-wider text-muted-foreground">
        ROAS-zoner
      </h4>
      <div className="flex rounded-lg overflow-hidden h-12 text-sm font-medium">
        <div className="flex-1 bg-red-100 dark:bg-red-950 border-r border-white/20 flex flex-col items-center justify-center text-red-700 dark:text-red-400">
          <span className="text-xs uppercase">Förlust</span>
          <span className="font-bold">&lt; {formatNumber(breakEvenRoas)}x</span>
        </div>
        <div className="flex-1 bg-yellow-100 dark:bg-yellow-950 border-r border-white/20 flex flex-col items-center justify-center text-yellow-700 dark:text-yellow-500">
          <span className="text-xs uppercase">Break-even</span>
          <span className="font-bold">{formatNumber(breakEvenRoas)}x – {formatNumber(targetRoas)}x</span>
        </div>
        <div className="flex-1 bg-green-100 dark:bg-green-950 flex flex-col items-center justify-center text-green-700 dark:text-green-400">
          <span className="text-xs uppercase">Lönsamt</span>
          <span className="font-bold">&gt; {formatNumber(targetRoas)}x</span>
        </div>
      </div>
    </div>
  );
}
