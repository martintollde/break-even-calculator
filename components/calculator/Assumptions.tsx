'use client';

import { Assumption } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface AssumptionsProps {
  assumptions: Assumption[];
}

function formatAssumptionValue(a: Assumption): string {
  if (a.displayValue) return a.displayValue;
  if (a.parameter === 'Fraktkostnad') return `${a.value} SEK`;
  if (a.parameter === 'LTV-multiplikator') return `${a.value}x`;
  return `${(a.value * 100).toFixed(1)}%`;
}

export function Assumptions({ assumptions }: AssumptionsProps) {
  const defaultAssumptions = assumptions.filter(a => a.source === 'industry_default');

  if (defaultAssumptions.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Alla värden baseras på dina egna data.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
        <span className="text-base">i</span> Antaganden som används:
      </h4>
      <ul className="space-y-1.5">
        {assumptions.map((a, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              {a.parameter}: <span className="font-medium text-foreground">{formatAssumptionValue(a)}</span>
            </span>
            <Badge variant={a.source === 'user' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
              {a.source === 'user' ? 'egen data' : 'branschsnitt'}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
