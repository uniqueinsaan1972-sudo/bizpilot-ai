"use client";
import { AlertTriangle, DollarSign, HeartPulse, Minus, PiggyBank, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Card, Label } from "./ui";
import { money } from "../lib/format";

function Stat({ icon: Icon, label, value, sub, tone = "text-white", accent = "text-indigo-300" }) {
  return (
    <Card className="fade-up">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Icon size={16} className={accent} />
      </div>
      <p className={`font-display text-xl font-bold tracking-tight sm:text-2xl ${tone}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </Card>
  );
}

export default function Overview({ b, a, csv }) {
  const cur = b.currency || "PKR";
  const rev = +b.monthly_revenue || 0;
  const exp = +b.monthly_expenses || 0;
  const profit = a ? a.estimated_monthly_profit : rev - exp;
  const margin = a ? a.profit_margin_percent : rev ? ((rev - exp) / rev) * 100 : 0;
  const trend = a?.sales_trend ?? csv?.trend;
  const TrendIcon = trend === "decreasing" ? TrendingDown : trend === "increasing" ? TrendingUp : Minus;
  const trendTone = trend === "decreasing" ? "text-rose-300" : trend === "increasing" ? "text-emerald-300" : "text-slate-200";
  const chg = csv?.trend_change_percent;
  const score = a?.health_score;
  const scoreColor = score >= 70 ? "bg-emerald-400" : score >= 45 ? "bg-amber-400" : "bg-rose-400";

  return (
    <div className="stagger grid grid-cols-2 gap-3 xl:grid-cols-5">
      <Stat icon={DollarSign} label="Revenue" value={money(rev, cur)} sub="per month" />
      <Stat icon={Wallet} label="Expenses" value={money(exp, cur)} sub={rev ? `${((exp / rev) * 100).toFixed(0)}% of revenue` : ""} />
      <Stat icon={PiggyBank} label="Profit" value={money(profit, cur)} sub={`${margin.toFixed(1)}% margin`}
        tone={profit >= 0 ? "text-emerald-300" : "text-rose-300"} accent="text-emerald-300" />
      <Stat icon={TrendIcon} label="Sales trend" value={trend ? trend[0].toUpperCase() + trend.slice(1) : "Analyzing..."}
        sub={chg !== null && chg !== undefined ? `${chg > 0 ? "+" : ""}${chg}% (last 2 months vs before)` : csv ? "Not enough data" : "Upload a CSV for trends"}
        tone={trendTone} accent={trendTone} />
      <Card className="fade-up col-span-2 xl:col-span-1">
        <div className="flex items-center justify-between"><Label>Business health</Label><HeartPulse size={16} className="text-rose-300" /></div>
        {a ? (
          <>
            <p className="text-xl font-bold sm:text-2xl">{a.business_health} <span className="text-sm font-medium text-slate-400">{score}/100</span></p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${scoreColor}`} style={{ width: `${score}%` }} /></div>
          </>
        ) : <p className="text-xl font-bold text-slate-500">Analyzing...</p>}
      </Card>
      <Card className="fade-up col-span-2 border-[rgba(255,30,77,0.4)] bg-[rgba(255,30,77,0.08)] xl:col-span-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-300" />
          <div>
            <Label>Main issue</Label>
            <p className="text-sm leading-relaxed text-slate-200">{a ? a.main_issue : b.problem || "Analyzing..."}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
