"use client";

import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface LineChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  xKey: string;
  lines: { key: string; color: string; name?: string }[];
  height?: number;
  xLabel?: string;
  yLabel?: string;
}

export function LineChart({ data, xKey, lines, height = 300, xLabel, yLabel }: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11 }}
          label={xLabel ? { value: xLabel, position: "insideBottom", offset: -10, fontSize: 12 } : undefined}
          tickFormatter={(value: string) => {
            if (value.includes("-")) return value.slice(5); // Date: show MM-DD
            return value;
          }}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          label={yLabel ? { value: yLabel, angle: -90, position: "insideLeft", fontSize: 12 } : undefined}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          labelFormatter={(label) => {
            if (typeof label === "string" && label.includes("-")) {
              return new Date(label).toLocaleDateString();
            }
            return String(label);
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            stroke={line.color}
            name={line.name || line.key}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
