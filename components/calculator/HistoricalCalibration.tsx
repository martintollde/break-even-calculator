'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Database, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  parseCSV,
  validateData,
  runOLS,
  RegressionResult,
  HistoricalDataPoint,
} from '@/lib/historical-calibration';

interface HistoricalCalibrationProps {
  onCalibrationResult: (result: RegressionResult | null) => void;
}

export function HistoricalCalibration({ onCalibrationResult }: HistoricalCalibrationProps) {
  const [enabled, setEnabled] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [data, setData] = useState<HistoricalDataPoint[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<RegressionResult | null>(null);

  const handleToggle = useCallback((checked: boolean) => {
    setEnabled(checked);
    if (!checked) {
      setResult(null);
      onCalibrationResult(null);
    }
  }, [onCalibrationResult]);

  const handleCSVChange = useCallback((text: string) => {
    setCsvText(text);
    setErrors([]);
    setResult(null);
  }, []);

  const handleCalibrate = useCallback(() => {
    const parsed = parseCSV(csvText);
    setData(parsed);

    const validation = validateData(parsed);
    if (!validation.valid) {
      setErrors(validation.errors);
      setResult(null);
      onCalibrationResult(null);
      return;
    }

    const regression = runOLS(parsed);
    if (!regression) {
      setErrors(['Regression kunde inte beräknas. Kontrollera datan.']);
      setResult(null);
      onCalibrationResult(null);
      return;
    }

    setErrors([]);
    setResult(regression);
    onCalibrationResult(regression);
  }, [csvText, onCalibrationResult]);

  const fitQualityBadge = result && {
    high: { label: 'Hög', variant: 'default' as const, className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
    medium: { label: 'Medium', variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
    low: { label: 'Låg', variant: 'destructive' as const, className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  }[result.fitQuality];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Database className="h-4 w-4" />
            Historisk kalibrering
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="calibration-toggle" className="text-xs text-muted-foreground">
              {enabled ? 'På' : 'Av'}
            </Label>
            <Switch
              id="calibration-toggle"
              checked={enabled}
              onCheckedChange={handleToggle}
            />
          </div>
        </div>
      </CardHeader>

      {enabled && (
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Klistra in CSV-data</Label>
            <p className="text-xs text-muted-foreground">
              Format: datum, spend, revenue (eller datum, spend, roas). Minst 5 rader.
            </p>
            <textarea
              className="w-full h-32 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono resize-y"
              placeholder={`datum;spend;revenue\n2024-01;50000;200000\n2024-02;60000;228000\n...`}
              value={csvText}
              onChange={(e) => handleCSVChange(e.target.value)}
            />
          </div>

          <Button
            onClick={handleCalibrate}
            disabled={!csvText.trim()}
            className="w-full"
            variant="secondary"
          >
            <Upload className="h-4 w-4 mr-2" />
            Kalibrera modell
          </Button>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-3 space-y-1">
              {errors.map((err, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold">Kalibrering klar</span>
                </div>
                {fitQualityBadge && (
                  <Badge className={fitQualityBadge.className}>
                    R² = {result.rSquared.toFixed(2)} ({fitQualityBadge.label})
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Datapunkter</div>
                  <div className="font-semibold">{result.n}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Elasticitet (b)</div>
                  <div className="font-semibold">{result.b.toFixed(3)}</div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                {result.interpretation}
              </p>

              {/* Scatter plot placeholder - data points */}
              {data.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Datapunkter (spend vs ROAS)</div>
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    <div className="font-medium text-muted-foreground">Datum</div>
                    <div className="font-medium text-muted-foreground text-right">Spend</div>
                    <div className="font-medium text-muted-foreground text-right">ROAS</div>
                    {data.slice(0, 10).map((d, i) => (
                      <>
                        <div key={`date-${i}`} className="truncate">{d.date}</div>
                        <div key={`spend-${i}`} className="text-right">{Math.round(d.spend).toLocaleString('sv-SE')}</div>
                        <div key={`roas-${i}`} className="text-right">{d.roas.toFixed(2)}</div>
                      </>
                    ))}
                    {data.length > 10 && (
                      <div className="col-span-3 text-muted-foreground text-center">
                        ...och {data.length - 10} till
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default HistoricalCalibration;
