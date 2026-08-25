"use client";

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

const COLORS = ["#B85C22", "#3F5D4A", "#0369A1", "#B45309", "#6D28D9", "#57534E"];

export function TypeDonut({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => indian(Number(value))} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CategoryBars({ data }: { data: { name: string; amount: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={70} />
        <YAxis tickFormatter={compact} />
        <Tooltip formatter={(value) => indian(Number(value))} />
        <Bar dataKey="amount" fill="#B85C22" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MonthlyChart({
  data,
}: {
  data: { label: string; material: number; labour: number; total: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={compact} />
        <Tooltip formatter={(value) => indian(Number(value))} />
        <Legend />
        <Line type="monotone" dataKey="material" stroke="#B85C22" strokeWidth={2} name="Material" />
        <Line type="monotone" dataKey="labour" stroke="#3F5D4A" strokeWidth={2} name="Labour" />
        <Line type="monotone" dataKey="total" stroke="#1c1917" strokeWidth={2} name="Total" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function WorkWiseBars({
  data,
}: {
  data: { name: string; material: number; labour: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={compact} />
        <Tooltip formatter={(value) => indian(Number(value))} />
        <Legend />
        <Bar dataKey="material" fill="#B85C22" name="Material" radius={[6, 6, 0, 0]} />
        <Bar dataKey="labour" fill="#3F5D4A" name="Labour" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function BudgetBars({
  data,
}: {
  data: { name: string; budget: number; actual: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
        <XAxis dataKey="name" />
        <YAxis tickFormatter={compact} />
        <Tooltip formatter={(value) => indian(Number(value))} />
        <Legend />
        <Bar dataKey="budget" fill="#A8A29E" name="Budget" radius={[6, 6, 0, 0]} />
        <Bar dataKey="actual" fill="#B85C22" name="Actual" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function indian(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function compact(value: number) {
  if (value >= 1_00_000) return `${(value / 1_00_000).toFixed(1)}L`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return String(value);
}
