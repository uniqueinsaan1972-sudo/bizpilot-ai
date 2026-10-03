"use client";
import { useState } from "react";
import { Check, Copy, Hourglass } from "lucide-react";

export const Card = ({ className = "", children, ...rest }) => (
  <div className={`glass rounded-2xl p-5 ${className}`} {...rest}>
    {children}
  </div>
);

export const Label = ({ children }) => (
  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{children}</p>
);

const TONES = {
  High: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  Medium: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  Low: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  Good: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  Fair: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  Poor: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  neutral: "bg-slate-500/15 text-slate-300 ring-slate-500/30",
  info: "bg-indigo-500/15 text-indigo-300 ring-indigo-500/30",
};
export const Badge = ({ tone = "neutral", children }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${TONES[tone] || TONES.neutral}`}>
    {children}
  </span>
);

export function CopyBtn({ text, label = "Copy" }) {
  const [ok, setOk] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); } catch {}
  };
  return (
    <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:border-rose-500/60 hover:bg-rose-500/10 hover:text-white">
      {ok ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
      {ok ? "Copied" : label}
    </button>
  );
}

export const Bullets = ({ items = [], dot = "bg-indigo-400" }) => (
  <ul className="space-y-2">
    {items.map((t, i) => (
      <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-300">
        <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
        <span>{t}</span>
      </li>
    ))}
  </ul>
);

export const Waiting = ({ name }) => (
  <Card className="flex items-center gap-3 text-sm text-slate-400">
    <Hourglass size={16} className="animate-pulse text-indigo-400" />
    Waiting for the {name} to finish...
  </Card>
);
