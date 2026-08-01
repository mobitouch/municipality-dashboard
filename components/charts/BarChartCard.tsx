"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function BarChartCard({
  data,
  color = "#4A6635",
  horizontal = false,
}: {
  data: { name: string; count: number }[];
  color?: string;
  horizontal?: boolean;
}) {
  if (!data.length) {
    return <p className="py-12 text-center text-sm text-slate-400">No data yet</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 4, right: 12, left: horizontal ? 24 : 0, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e1d8" />
        {horizontal ? (
          <>
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#8a8579" }} />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              tick={{ fontSize: 12, fill: "#2C3325" }}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#2C3325" }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#8a8579" }} />
          </>
        )}
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e1d8" }}
          cursor={{ fill: "#f4f1ec" }}
        />
        <Bar dataKey="count" fill={color} radius={[4, 4, 4, 4]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}
