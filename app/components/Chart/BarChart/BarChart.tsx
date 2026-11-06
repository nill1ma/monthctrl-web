import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";

type BarChartProps = {
  id: string;
  dataAxis: string[];
  data: number[];
  className?: string;
};

export default function BarChartComponent({
  dataAxis,
  data,
  className,
}: BarChartProps) {
  const chartData = dataAxis.map((label, index) => ({
    label,
    value: data[index] ?? 0,
  }));

  return (
    <div className={className} style={{ width: "100%", height: 250 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis
            dataKey="label"
            tick={{ fill: "#ffffff", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: "#ffffff", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill="#a3e635" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
