"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS: Record<string, string> = {
  New: "#2a78d6",
  "Under Review": "#eb6834",
  Assigned: "#1baf7a",
  "In Progress": "#eda100",
  Resolved: "#008300",
  Closed: "#4a3aa7",
  Rejected: "#e34948",
};

export default function StatusPieChart({ data }: { data: { name: string; count: number }[] }) {
  if (!data.length) {
    return <p className="py-12 text-center text-sm text-slate-400">No data yet</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name] ?? "#898781"} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e1d8" }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
