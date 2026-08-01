"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function MonthlyTrendChart({ data }: { data: { label: string; count: number }[] }) {
  if (!data.length) {
    return <p className="py-12 text-center text-sm text-slate-400">No data yet</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
        <defs>
          <linearGradient id="monthlyFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4A6635" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#4A6635" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e1d8" />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#2C3325" }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#8a8579" }} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e1d8" }} />
        <Area type="monotone" dataKey="count" stroke="#4A6635" strokeWidth={2} fill="url(#monthlyFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
