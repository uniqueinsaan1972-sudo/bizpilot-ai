"use client";
import { Check, Circle, Loader2, Timer, X } from "lucide-react";
import { AGENTS } from "../lib/agents";
import { Card } from "./ui";
import { secs } from "../lib/format";

export default function Workflow({ agents, now, runStart, runEnd, status, csv }) {
  const total = runStart ? ((runEnd || now) - runStart) / 1000 : null;
  const doneCount = AGENTS.filter((a) => agents[a.id]?.status === "done").length;

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Agent workflow</h2>
          <p className="text-xs text-slate-400">{doneCount} of {AGENTS.length} agents completed</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-line bg-slate-900/60 px-2.5 py-1.5 font-mono text-xs text-slate-300">
          <Timer size={13} className={status === "running" ? "text-indigo-400" : "text-slate-500"} />
          {total === null ? "0.0s" : secs(total)}
          {status === "done" && <span className="text-emerald-400">total</span>}
        </div>
      </div>

      <div className="mb-4 h-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 shadow-[0_0_12px_rgba(255,30,77,0.7)] transition-all duration-700" style={{ width: `${(doneCount / AGENTS.length) * 100}%` }} />
      </div>

      {csv && (
        <p className="mb-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200">
          CSV processed: {csv.rows.toLocaleString()} rows
          {csv.warnings?.length > 0 && <span className="text-amber-300"> · {csv.warnings[0]}</span>}
        </p>
      )}

      <ol>
        {AGENTS.map((a, i) => {
          const s = agents[a.id] || { status: "pending" };
          const live = s.status === "running" ? (now - s.startedAt) / 1000 : null;
          const last = i === AGENTS.length - 1;
          return (
            <li key={a.id} className="relative flex gap-3 pb-4 last:pb-0">
              {!last && <span className={`absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-px ${s.status === "done" ? "bg-emerald-500/50" : "bg-white/10"}`} />}
              <span className={`z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs ${
                s.status === "done" ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                : s.status === "running" ? "pulse-ring border-indigo-400/70 bg-indigo-500/25 text-indigo-200"
                : s.status === "error" ? "border-rose-500/50 bg-rose-500/20 text-rose-300"
                : "border-line bg-slate-900 text-slate-500"}`}>
                {s.status === "done" ? <Check size={14} /> : s.status === "running" ? <Loader2 size={14} className="animate-spin" />
                  : s.status === "error" ? <X size={14} /> : <Circle size={9} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-medium ${s.status === "pending" ? "text-slate-400" : "text-white"}`}>{a.title}</p>
                  <span className="font-mono text-xs text-slate-400">
                    {s.status === "done" && <span className="text-emerald-300">Completed · {secs(s.seconds)}</span>}
                    {s.status === "running" && <span className="text-indigo-300">Running · {secs(live)}</span>}
                    {s.status === "error" && <span className="text-rose-300">Failed</span>}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{a.desc}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
