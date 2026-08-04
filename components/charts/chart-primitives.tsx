"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { STATUS_STYLES } from "@/lib/constants";

export interface NamedCount {
  name: string;
  count: number;
}

/**
 * Chart colours come from the same CSS custom properties as the rest of
 * the UI, so light/dark switching needs no JavaScript and no re-render.
 */
const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const AXIS_PROPS = {
  stroke: "var(--muted-foreground)",
  fontSize: 12,
  tickLine: false,
  axisLine: false,
} as const;

const TOOLTIP_STYLE = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "0.5rem",
  color: "var(--popover-foreground)",
  fontSize: "0.8125rem",
  padding: "0.5rem 0.75rem",
} as const;

function EmptyChart({ height }: { height: number }) {
  return (
    <div
      className="text-muted-foreground flex items-center justify-center text-sm"
      style={{ height }}
    >
      Not enough data yet.
    </div>
  );
}

export function HorizontalBarChart({
  data,
  color = "var(--chart-1)",
  height,
  valueLabel = "Requests",
}: {
  data: NamedCount[];
  color?: string;
  height?: number;
  valueLabel?: string;
}) {
  const chartHeight = height ?? Math.max(160, data.length * 30 + 20);
  if (!data.length) return <EmptyChart height={chartHeight} />;

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis type="number" allowDecimals={false} {...AXIS_PROPS} />
        <YAxis type="category" dataKey="name" width={130} {...AXIS_PROPS} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={{ fill: "var(--muted)", opacity: 0.5 }}
          formatter={(value) => [value, valueLabel]}
        />
        <Bar dataKey="count" fill={color} radius={[0, 4, 4, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StatusDonutChart({ data }: { data: NamedCount[] }) {
  if (!data.length) return <EmptyChart height={260} />;

  // Reuse the status badge hues so the chart and the table agree visually.
  const colorFor = (name: string, index: number) => {
    const style = STATUS_STYLES[name as keyof typeof STATUS_STYLES];
    if (!style) return PALETTE[index % PALETTE.length];
    if (name === "New") return "var(--chart-4)";
    if (name === "In Progress") return "var(--chart-1)";
    if (name === "Resolved" || name === "Closed") return "var(--chart-3)";
    if (name === "Rejected") return "var(--chart-5)";
    return "var(--chart-2)";
  };

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="name"
          innerRadius={54}
          outerRadius={88}
          paddingAngle={2}
          stroke="var(--card)"
          strokeWidth={2}
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={colorFor(entry.name, index)} />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend
          verticalAlign="bottom"
          height={44}
          iconType="circle"
          iconSize={8}
          formatter={(value: string) => (
            <span style={{ color: "var(--muted-foreground)", fontSize: "0.75rem" }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function MonthlyTrendChart({
  data,
}: {
  data: Array<{ label: string; count: number; resolved: number }>;
}) {
  if (!data.length) return <EmptyChart height={260} />;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ left: -18, right: 12, top: 8, bottom: 4 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" {...AXIS_PROPS} />
        <YAxis allowDecimals={false} {...AXIS_PROPS} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend
          verticalAlign="top"
          height={28}
          iconType="plainline"
          iconSize={14}
          formatter={(value: string) => (
            <span style={{ color: "var(--muted-foreground)", fontSize: "0.75rem" }}>{value}</span>
          )}
        />
        <Line
          type="monotone"
          dataKey="count"
          name="Received"
          stroke="var(--chart-1)"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="resolved"
          name="Resolved"
          stroke="var(--chart-3)"
          strokeWidth={2}
          strokeDasharray="4 3"
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
