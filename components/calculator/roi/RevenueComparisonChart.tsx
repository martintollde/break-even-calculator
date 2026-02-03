'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { MonthlyProjection } from '@/lib/types';

interface RevenueComparisonChartProps {
  ifWeDo: MonthlyProjection[];
  ifWeWait: MonthlyProjection[];
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
  revenueAct: number;
  revenueWait: number;
}

export function RevenueComparisonChart({ ifWeDo, ifWeWait }: RevenueComparisonChartProps) {
  const data: ChartDataPoint[] = ifWeDo.map((doMonth, i) => ({
    label: doMonth.label,
    month: doMonth.month,
    revenueAct: doMonth.revenue,
    revenueWait: ifWeWait[i].revenue,
  }));

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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
            formatter={(value, name) => [
              formatCurrencyFull(Number(value ?? 0)),
              name === 'revenueAct' ? 'Om vi agerar' : 'Om vi väntar',
            ]}
            labelFormatter={(label) => `Månad: ${label}`}
            contentStyle={{ fontSize: 13 }}
          />
          <Legend
            formatter={(value) =>
              value === 'revenueAct' ? 'Om vi agerar' : 'Om vi väntar'
            }
          />
          <Line
            type="monotone"
            dataKey="revenueAct"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="revenueWait"
            stroke="#9ca3af"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
