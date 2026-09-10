import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ConditionRobustness } from "../lib/report";

export default function RobustnessChart({ data }: { data: ConditionRobustness[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ left: 24, right: 24 }}>
        <XAxis type="number" domain={[0, 100]} tick={{ fill: "#8aa0c0", fontSize: 12 }} stroke="#2b3a5c" />
        <YAxis
          type="category"
          dataKey="condition"
          width={110}
          tick={{ fill: "#c4d1e6", fontSize: 12 }}
          stroke="#2b3a5c"
        />
        <Tooltip
          cursor={{ fill: "rgba(91,157,255,0.08)" }}
          contentStyle={{
            background: "#0f1628",
            border: "1px solid #2b3a5c",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(v: number, _n, p) => [
            `${v}% robustness · ${p.payload.violations}/${p.payload.tests} violations`,
            p.payload.condition,
          ]}
        />
        <Bar dataKey="robustness" radius={[0, 5, 5, 0]} barSize={18}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={d.robustness < 55 ? "#f87171" : d.robustness < 75 ? "#fbbf24" : "#34d399"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
