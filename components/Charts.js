"use client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "./ui";

const axis = { stroke: "#71717e", fontSize: 11, tickLine: false, axisLine: false };
const tip = {
  contentStyle: { background: "#111115", border: "1px solid rgba(255,255,255,.14)", borderRadius: 14, fontSize: 12, boxShadow: "0 10px 30px rgba(0,0,0,.6)" },
  labelStyle: { color: "#9a9aa6" }, itemStyle: { color: "#fff" }, cursor: { fill: "rgba(255,255,255,.05)" },
};
const grid = "rgba(255,255,255,.07)";
const k = (v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${Math.round(v / 1e3)}k` : v);
const full = (v) => Math.round(v).toLocaleString("en-US");

/* vertical (bottom -> top) and horizontal (left -> right) gradients */
const Defs = () => (
  <defs>
    {[
      ["gBlue", "#1e3a8a", "#38bdf8"],
      ["gAmber", "#f97316", "#facc15"],
      ["gGreen", "#14532d", "#4ade80"],
      ["gPink", "#8e2de2", "#ff2e8a"],
    ].map(([id, a, b]) => (
      <g key={id}>
        <linearGradient id={id} x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor={a} /><stop offset="100%" stopColor={b} /></linearGradient>
        <linearGradient id={`${id}H`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={a} /><stop offset="100%" stopColor={b} /></linearGradient>
      </g>
    ))}
    <linearGradient id="gLine" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#8e2de2" /><stop offset="55%" stopColor="#e0208a" /><stop offset="100%" stopColor="#ff2e63" /></linearGradient>
    <linearGradient id="gAreaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e0208a" stopOpacity={0.5} /><stop offset="100%" stopColor="#e0208a" stopOpacity={0} /></linearGradient>
  </defs>
);

function Chart({ title, sub, children }) {
  return (
    <Card className="fade-up">
      <p className="font-display text-base font-bold text-white">{title}</p>
      <p className="mb-3 text-xs text-slate-400">{sub}</p>
      <div className="h-56">{children}</div>
    </Card>
  );
}

export default function Charts({ rev, exp, profit, csv }) {
  const money3 = [
    { name: "Revenue", v: rev, fill: "url(#gBlue)" },
    { name: "Expenses", v: exp, fill: "url(#gAmber)" },
    { name: "Profit", v: profit, fill: "url(#gGreen)" },
  ];
  const months = csv?.monthly_revenue || [];
  const topN = (csv?.top_products || []).length;
  const prods = [...(csv?.top_products || []), ...(csv?.weak_products || [])];

  return (
    <div className="stagger grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
      <Chart title="Revenue vs expenses vs profit" sub="Monthly, as entered">
        <ResponsiveContainer>
          <BarChart data={money3}>
            <Defs />
            <CartesianGrid stroke={grid} vertical={false} strokeDasharray="3 5" />
            <XAxis dataKey="name" {...axis} /><YAxis {...axis} tickFormatter={k} width={40} />
            <Tooltip {...tip} formatter={(v) => full(v)} />
            <Bar dataKey="v" radius={[10, 10, 4, 4]} maxBarSize={64}>{money3.map((d) => <Cell key={d.name} fill={d.fill} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </Chart>

      {months.length > 0 && (
        <Chart title="Sales trend" sub="Monthly revenue from your CSV">
          <ResponsiveContainer>
            <AreaChart data={months}>
              <Defs />
              <CartesianGrid stroke={grid} vertical={false} strokeDasharray="3 5" />
              <XAxis dataKey="month" {...axis} /><YAxis {...axis} tickFormatter={k} width={40} />
              <Tooltip {...tip} formatter={(v) => full(v)} />
              <Area type="monotone" dataKey="revenue" stroke="url(#gLine)" strokeWidth={3} fill="url(#gAreaFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </Chart>
      )}

      {prods.length > 0 && (
        <Chart title="Best vs weakest products" sub="Total revenue per product (CSV)">
          <ResponsiveContainer>
            <BarChart data={prods} layout="vertical" margin={{ left: 8 }}>
              <Defs />
              <CartesianGrid stroke={grid} horizontal={false} strokeDasharray="3 5" />
              <XAxis type="number" {...axis} tickFormatter={k} /><YAxis type="category" dataKey="product" {...axis} width={86} />
              <Tooltip {...tip} formatter={(v) => full(v)} />
              <Bar dataKey="revenue" radius={[0, 10, 10, 0]} maxBarSize={26}>
                {prods.map((p, i) => <Cell key={p.product} fill={i < topN ? "url(#gBlueH)" : "url(#gAmberH)"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Chart>
      )}
    </div>
  );
}
