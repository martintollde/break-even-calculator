'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Scenario } from '@/lib/types';
import { formatNumber, formatCurrency } from '@/lib/export';
import { Save, X, ArrowUpDown } from 'lucide-react';

interface ScenarioCompareProps {
  scenarios: Scenario[];
  canSave: boolean;
  onSave: (name: string) => void;
  onRemove: (id: string) => void;
  onLoad: (scenario: Scenario) => void;
}

export function ScenarioCompare({ scenarios, canSave, onSave, onRemove, onLoad }: ScenarioCompareProps) {
  const [name, setName] = useState('');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim());
    setName('');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Jämför scenarios
      </h3>

      {/* Save current */}
      {canSave && (
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Namnge scenario..."
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <Button onClick={handleSave} variant="outline" size="sm" disabled={!name.trim()}>
            <Save className="h-4 w-4 mr-1" />
            Spara
          </Button>
        </div>
      )}

      {scenarios.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Fyll i kalkylatorn och spara scenarios för att jämföra dem.
        </p>
      )}

      {/* Comparison table */}
      {scenarios.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Metric</th>
                {scenarios.map(s => (
                  <th key={s.id} className="text-center py-2 px-2">
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-medium">{s.name}</span>
                      <button onClick={() => onRemove(s.id)} className="text-muted-foreground hover:text-red-500">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4 text-muted-foreground">AOV</td>
                {scenarios.map(s => (
                  <td key={s.id} className="text-center py-2 px-2 font-medium">
                    {formatCurrency(s.inputs.aov)}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-muted-foreground">Break-even ROAS</td>
                {scenarios.map(s => (
                  <td key={s.id} className="text-center py-2 px-2 font-bold">
                    {formatNumber(s.outputs.breakEvenRoas)}x
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-muted-foreground">Target ROAS / COS</td>
                {scenarios.map(s => (
                  <td key={s.id} className="text-center py-2 px-2 font-medium">
                    {formatNumber(s.outputs.targetRoas)}x / {formatNumber(s.outputs.targetCos)}%
                    <span className="text-xs text-muted-foreground ml-1">({s.outputs.desiredProfitMargin}%)</span>
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-muted-foreground">Max CPA</td>
                {scenarios.map(s => (
                  <td key={s.id} className="text-center py-2 px-2 font-medium">
                    {formatCurrency(s.outputs.maxCpa)}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-muted-foreground">Max CPA (LTV)</td>
                {scenarios.map(s => (
                  <td key={s.id} className="text-center py-2 px-2 font-medium">
                    {formatCurrency(s.outputs.maxCpaWithLtv)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 pr-4 text-muted-foreground">Precision</td>
                {scenarios.map(s => (
                  <td key={s.id} className="text-center py-2 px-2 font-medium capitalize">
                    {s.outputs.confidenceLevel === 'high' ? 'Hög' : s.outputs.confidenceLevel === 'medium' ? 'Medium' : 'Låg'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Load buttons */}
      {scenarios.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {scenarios.map(s => (
            <Button key={s.id} variant="ghost" size="sm" onClick={() => onLoad(s)}>
              <ArrowUpDown className="h-3 w-3 mr-1" />
              Ladda {s.name}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
