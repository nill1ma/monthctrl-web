"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useIntl } from "react-intl";

interface Item {
  value?: number | null;
  origin?: string;
  destination?: string;
  [key: string]: unknown;
}

interface CurrencyChartProps {
  currency: string;
  incomings: Item[];
  expenses: Item[];
}

function formatValue(v: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(v);
}

export default function CurrencyChart({ currency, incomings, expenses }: CurrencyChartProps) {
  const { formatMessage } = useIntl();

  // Merge incomings and expenses into a single dataset keyed by label
  const labelMap = new Map<string, { label: string; incoming: number; expense: number }>();

  for (const item of incomings) {
    const label = item.origin ?? "—";
    const existing = labelMap.get(label) ?? { label, incoming: 0, expense: 0 };
    existing.incoming += item.value ?? 0;
    labelMap.set(label, existing);
  }

  for (const item of expenses) {
    const label = item.destination ?? "—";
    const existing = labelMap.get(label) ?? { label, incoming: 0, expense: 0 };
    existing.expense += item.value ?? 0;
    labelMap.set(label, existing);
  }

  const data = Array.from(labelMap.values());

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
        <XAxis
          dataKey="label"
          tick={{ fill: "currentColor", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fill: "currentColor", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatValue(v, currency)}
          width={80}
        />
        <Tooltip
          formatter={(value: number) => formatValue(value, currency)}
          contentStyle={{ borderRadius: 8, fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar
          dataKey="incoming"
          name={formatMessage({ id: "details.incomings" })}
          fill="#4ade80"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="expense"
          name={formatMessage({ id: "details.expenses" })}
          fill="#f87171"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
