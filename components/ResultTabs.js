"use client";
import { useState } from "react";
import { Check, Download, Loader2, Mail, MessageSquare } from "lucide-react";
import { Badge, Bullets, Card, CopyBtn, Label, Waiting } from "./ui";
import { money, reportToMarkdown } from "../lib/format";

const TABS = [
  { id: "analysis", label: "Analysis", key: "analysis", agent: "Business Analyst" },
  { id: "strategy", label: "Strategy", key: "strategy", agent: "Strategy Agent" },
  { id: "marketing", label: "Marketing", key: "marketing", agent: "Marketing Agent" },
  { id: "tasks", label: "Tasks", key: "tasks", agent: "Action Agent" },
  { id: "report", label: "Report", key: "report", agent: "Report Agent" },
];

function Analysis({ a }) {
  const trendTone = a.sales_trend === "decreasing" ? "High" : a.sales_trend === "increasing" ? "Low" : "neutral";
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card><Label>Revenue analysis</Label><p className="text-sm leading-relaxed text-slate-300">{a.revenue_analysis}</p></Card>
      <Card><Label>Expense analysis</Label><p className="text-sm leading-relaxed text-slate-300">{a.expense_analysis}</p></Card>
      <Card className="lg:col-span-2">
        <div className="mb-1 flex items-center gap-2"><Label>Sales trend</Label><Badge tone={trendTone}>{a.sales_trend}</Badge></div>
        <p className="text-sm leading-relaxed text-slate-300">{a.sales_trend_explanation}</p>
      </Card>
      <Card><Label>Best-performing products</Label>{a.best_products.length ? <Bullets items={a.best_products} dot="bg-emerald-400" /> : <p className="text-sm text-slate-500">Upload a CSV with a product column to see this.</p>}</Card>
      <Card><Label>Weak-performing products</Label>{a.weak_products.length ? <Bullets items={a.weak_products} dot="bg-orange-400" /> : <p className="text-sm text-slate-500">Upload a CSV with a product column to see this.</p>}</Card>
      <Card><Label>Key observations</Label><Bullets items={a.key_observations} /></Card>
      <Card><Label>Possible problems</Label><Bullets items={a.possible_problems} dot="bg-rose-400" /></Card>
      <Card className="lg:col-span-2 border-line bg-white/[0.02]">
        <div className="mb-2 flex items-center gap-2"><Label>Confidence and limitations</Label><Badge tone="info">{a.confidence} confidence</Badge></div>
        <Bullets items={a.limitations} dot="bg-slate-500" />
      </Card>
    </div>
  );
}

function Strategy({ s }) {
  return (
    <div className="space-y-3">
      {s.recommendations.map((r, i) => (
        <Card key={i} className="flex gap-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-bold text-indigo-300">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-white sm:text-base">{r.title}</h3>
              <Badge tone={r.priority}>{r.priority} priority</Badge>
              <Badge tone="info">{r.timeframe}</Badge>
            </div>
            <p className="text-sm leading-relaxed text-slate-300"><span className="text-slate-500">Why: </span>{r.reason}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-300"><span className="text-slate-500">Expected impact: </span>{r.expected_impact}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

function CopyBlock({ title, icon: Icon, text, subject }) {
  return (
    <Card>
      <div className="mb-2 flex items-center justify-between gap-2">
        <Label>{Icon && <Icon size={12} className="mr-1 inline" />}{title}</Label>
        <CopyBtn text={subject ? `Subject: ${subject}\n\n${text}` : text} />
      </div>
      {subject && <p className="mb-1.5 text-sm font-medium text-white">Subject: {subject}</p>}
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{text}</p>
    </Card>
  );
}

function Marketing({ m }) {
  return (
    <div className="space-y-3">
      <Card className="card-glow">
        <Label>Campaign idea</Label>
        <h3 className="text-lg font-semibold text-white">{m.campaign_idea.name}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-300">{m.campaign_idea.concept}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">{m.campaign_idea.target_channels.map((c) => <Badge key={c} tone="info">{c}</Badge>)}</div>
      </Card>
      <div className="grid gap-3 lg:grid-cols-2">
        <CopyBlock title="Instagram caption" text={m.instagram_caption} />
        <CopyBlock title="Facebook post" text={m.facebook_post} />
        <CopyBlock title="Ad copy" text={m.ad_copy} />
        <CopyBlock title="Promotional message" text={m.promotional_message} />
        <CopyBlock title="Email" icon={Mail} subject={m.email_copy.subject} text={m.email_copy.body} />
        <CopyBlock title="SMS" icon={MessageSquare} text={m.sms_copy} />
      </div>
    </div>
  );
}

function Tasks({ t }) {
  const [done, setDone] = useState({});
  const order = { High: 0, Medium: 1, Low: 2 };
  const tasks = [...t.tasks].sort((x, y) => order[x.priority] - order[y.priority]);
  const n = Object.values(done).filter(Boolean).length;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{n} of {tasks.length} tasks completed</span>
        <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-emerald-400 transition-all" style={{ width: `${(n / tasks.length) * 100}%` }} /></div>
      </div>
      {tasks.map((x, i) => (
        <Card key={i} className="flex gap-3 !p-4">
          <button onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))}
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${done[i] ? "border-emerald-400 bg-emerald-500/30 text-emerald-200" : "border-rose-500/40 hover:border-white/40"}`}>
            {done[i] && <Check size={13} />}
          </button>
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-medium ${done[i] ? "text-slate-500 line-through" : "text-white"}`}>{x.task}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{x.reason}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5"><Badge tone={x.priority}>{x.priority}</Badge><Badge>{x.deadline}</Badge></div>
        </Card>
      ))}
    </div>
  );
}

function Report({ r, b }) {
  const cur = b.currency || "PKR";
  const md = reportToMarkdown(r, b);
  const download = () => {
    const url = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `${b.business_name.replace(/\W+/g, "-")}-business-plan.md` });
    a.click(); URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2">
        <CopyBtn text={md} label="Copy report" />
        <button onClick={download} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-white/10"><Download size={13} /> Download .md</button>
      </div>
      <Card className="card-glow">
        <Label>Executive summary</Label>
        <p className="text-[15px] leading-relaxed text-slate-100">{r.executive_summary}</p>
      </Card>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[["Health", `${r.business_health} · ${r.health_score}`], ["Revenue", money(r.revenue, cur)], ["Expenses", money(r.expenses, cur)], ["Est. profit", money(r.estimated_profit, cur)], ["Sales trend", r.sales_trend]].map(([l, v]) => (
          <Card key={l} className="!p-4"><Label>{l}</Label><p className="text-sm font-semibold capitalize text-white">{v}</p></Card>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Card><Label>Main problems</Label><Bullets items={r.main_problems} dot="bg-rose-400" /></Card>
        <Card><Label>Key insights</Label><Bullets items={r.key_insights} /></Card>
        <Card><Label>Recommended strategy</Label><p className="text-sm leading-relaxed text-slate-300">{r.recommended_strategy}</p></Card>
        <Card><Label>Marketing plan</Label><p className="text-sm leading-relaxed text-slate-300">{r.marketing_plan}</p></Card>
        <Card className="lg:col-span-2"><Label>Action plan</Label><Bullets items={r.action_plan} dot="bg-emerald-400" /></Card>
      </div>
      <p className="text-center text-xs text-slate-500">AI-generated analysis based on the data you provided. Review before acting on it.</p>
    </div>
  );
}

export default function ResultTabs({ outputs, agents, tab, setTab, b }) {
  const body = {
    analysis: (o) => <Analysis a={o} />, strategy: (o) => <Strategy s={o} />, marketing: (o) => <Marketing m={o} />,
    tasks: (o) => <Tasks t={o} />, report: (o) => <Report r={o} b={b} />,
  };
  const cur = TABS.find((t) => t.id === tab);
  return (
    <div>
      <div className="glass mb-4 flex gap-1 overflow-x-auto !rounded-full p-1.5">
        {TABS.map((t) => {
          const ready = !!outputs[t.key];
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition ${tab === t.id ? "pill-active text-white" : "text-slate-400 hover:text-slate-200"}`}>
              {t.label}
              {ready ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> : <Loader2 size={12} className="animate-spin opacity-40" />}
            </button>
          );
        })}
      </div>
      <div key={tab} className="fade-up">
        {outputs[cur.key] ? body[tab](outputs[cur.key]) : <Waiting name={cur.agent} />}
      </div>
    </div>
  );
}
