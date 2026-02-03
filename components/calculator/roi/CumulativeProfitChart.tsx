'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { MonthlyProjection } from '@/lib/types';

interface CumulativeProfitChartProps {
  ifWeDo: MonthlyProjection[];
  breakEvenMonth: number;
}

function formatCurrencyShort(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)} Mkr`;
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(0)} tkr`;
  }
  return `${value.toFixed(0)} kr`;
}

function formatCurrencyFull(value: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface ChartDataPoint {
  label: string;
  month: number;
  cumulativeProfit: number;
}

export function CumulativeProfitChart({ ifWeDo, breakEvenMonth }: CumulativeProfitChartProps) {
  const data: ChartDataPoint[] = ifWeDo.map((proj) => ({
    label: proj.label,
    month: proj.month,
    cumulativeProfit: proj.cumulativeProfit,
  }));

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="lossGradient" x1="0" y1="1" x2="0" y2="0">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
          />
          <YAxis
            tickFormatter={formatCurrencyShort}
            tick={{ fontSize: 11 }}
            stroke="#9ca3af"
            width={70}
          />
          <Tooltip
            formatter={(value) => [
              formatCurrencyFull(Number(value ?? 0)),
              'Kumulativ vinst',
            ]}
            labelFormatter={(label) => `Månad: ${label}`}
            contentStyle={{ fontSize: 13 }}
          />
          <ReferenceLine
            y={0}
            stroke="#6b7280"
            strokeDasharray="3 3"
            label={{ value: 'Break-even', position: 'left', fontSize: 11, fill: '#6b7280' }}
          />
          {breakEvenMonth <= 12 && (
            <ReferenceLine
              x={data[breakEvenMonth - 1]?.label}
              stroke="#22c55e"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{
                value: `Mån ${breakEvenMonth}`,
                position: 'top',
                fontSize: 11,
                fill: '#22c55e',
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey="cumulativeProfit"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#profitGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
