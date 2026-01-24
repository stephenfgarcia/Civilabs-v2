"use client";

import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

interface BarChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  xKey: string;
  bars: { key: string; color: string; name?: string }[];
  height?: number;
  xLabel?: string;
  yLabel?: string;
  colorByValue?: boolean;
  stacked?: boolean;
}

const GRADIENT_COLORS = [
  "#EF4444", "#F59E0B", "#F59E0B", "#EAB308",
  "#84CC16", "#22C55E", "#22C55E", "#10B981",
  "#10B981", "#059669",
];

export function BarChart({ data, xKey, bars, height = 300, xLabel, yLabel, colorByValue, stacked }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11 }}
          label={xLabel ? { value: xLabel, position: "insideBottom", offset: -10, fontSize: 12 } : undefined}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          label={yLabel ? { value: yLabel, angle: -90, position: "insideLeft", fontSize: 12 } : undefined}
        />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {bars.map((bar) => (
          <Bar
            key={bar.key}
            dataKey={bar.key}
            name={bar.name || bar.key}
            fill={bar.color}
            radius={[4, 4, 0, 0]}
            stackId={stacked ? "stack" : undefined}
          >
            {colorByValue && data.map((_, index) => (
              <Cell key={index} fill={GRADIENT_COLORS[Math.min(index, 9)]} />
            ))}
          </Bar>
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
