"use client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "./ui";

const axis = { stroke: "#786b70", fontSize: 11, tickLine: false, axisLine: false };
const tip = { contentStyle: { background: "#140a0f", border: "1px solid rgba(220,20,60,.4)", borderRadius: 12, fontSize: 12 }, labelStyle: { color: "#94a3b8" }, cursor: { fill: "rgba(255,30,77,.06)" } };
const k = (v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${Math.round(v / 1e3)}k` : v);
const full = (v) => Math.round(v).toLocaleString("en-US");

function Chart({ title, sub, children }) {
  return (
    <Card className="fade-up">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mb-3 text-xs text-slate-400">{sub}</p>
      <div className="h-56">{children}</div>
    </Card>
  );
}

export default function Charts({ rev, exp, profit, csv }) {
  const money3 = [
    { name: "Revenue", v: rev, c: "#ff1e4d" },
    { name: "Expenses", v: exp, c: "#ff9f1c" },
    { name: "Profit", v: profit, c: "#2ee6a6" },
  ];
  const months = csv?.monthly_revenue || [];
  const prods = [...(csv?.top_products || []), ...(csv?.weak_products || [])];

  return (
    <div className="stagger grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
      <Chart title="Revenue vs expenses vs profit" sub="Monthly, as entered">
        <ResponsiveContainer>
          <BarChart data={money3}>
            <CartesianGrid stroke="rgba(255,30,77,.09)" vertical={false} />
            <XAxis dataKey="name" {...axis} /><YAxis {...axis} tickFormatter={k} width={40} />
            <Tooltip {...tip} formatter={(v) => full(v)} />
            <Bar dataKey="v" radius={[8, 8, 0, 0]}>{money3.map((d) => <Cell key={d.name} fill={d.c} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </Chart>

      {months.length > 0 && (
        <Chart title="Sales trend" sub="Monthly revenue from your CSV">
          <ResponsiveContainer>
            <AreaChart data={months}>
              <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff1e4d" stopOpacity={0.55} /><stop offset="100%" stopColor="#ff1e4d" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid stroke="rgba(255,30,77,.09)" vertical={false} />
              <XAxis dataKey="month" {...axis} /><YAxis {...axis} tickFormatter={k} width={40} />
              <Tooltip {...tip} formatter={(v) => full(v)} />
              <Area type="monotone" dataKey="revenue" stroke="#ff1e4d" strokeWidth={2.5} fill="url(#g)" />
            </AreaChart>
          </ResponsiveContainer>
        </Chart>
      )}

      {prods.length > 0 && (
        <Chart title="Best vs weakest products" sub="Total revenue per product (CSV)">
          <ResponsiveContainer>
            <BarChart data={prods} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid stroke="rgba(255,30,77,.09)" horizontal={false} />
              <XAxis type="number" {...axis} tickFormatter={k} /><YAxis type="category" dataKey="product" {...axis} width={80} />
              <Tooltip {...tip} formatter={(v) => full(v)} />
              <Bar dataKey="revenue" radius={[0, 8, 8, 0]}>
                {prods.map((p, i) => <Cell key={p.product} fill={i < (csv.top_products || []).length ? "#ff1e4d" : "#ff9f1c"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Chart>
      )}
    </div>
  );
}
