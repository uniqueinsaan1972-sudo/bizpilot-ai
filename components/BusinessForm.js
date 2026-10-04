"use client";
import { useRef, useState } from "react";
import { ArrowRight, FileSpreadsheet, Loader2, Play, Square, UploadCloud, Wand2, X } from "lucide-react";
import { Card, Label } from "./ui";

const input = "field w-full rounded-xl px-3.5 py-2.5 text-[15px] font-medium text-white placeholder:text-slate-500 outline-none disabled:opacity-60";

export default function BusinessForm({ form, setForm, csvFile, setCsvFile, running, error, onRun, onStop, onDemo }) {
  const [drag, setDrag] = useState(false);
  const fileRef = useRef(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const pick = (f) => { if (f) setCsvFile(f); };

  const field = (k, label, props = {}) => (
    <div>
      <Label>{label}</Label>
      <input className={input} value={form[k]} onChange={set(k)} disabled={running} {...props} />
    </div>
  );

  return (
    <Card className="card-hero space-y-4 !p-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-white">Business information</h2>
          <p className="text-[13px] text-slate-300">Tell BizPilot about your business.</p>
        </div>
        <button onClick={onDemo} disabled={running} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-indigo-400/40 bg-black/40 px-3 py-1.5 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/20 disabled:opacity-50">
          <Wand2 size={13} /> Load demo
        </button>
      </div>

      {field("business_name", "Business name", { placeholder: "e.g. ABC Clothing" })}
      <div className="grid grid-cols-2 gap-3">
        {field("industry", "Industry", { placeholder: "e.g. Fashion" })}
        {field("target_audience", "Target audience", { placeholder: "e.g. Young adults" })}
      </div>
      {field("products", "Products / services", { placeholder: "Hoodies, Jeans, ..." })}
      <div className="grid grid-cols-[1fr_1fr_80px] gap-3">
        {field("monthly_revenue", "Monthly revenue", { type: "number", min: "0", placeholder: "500000" })}
        {field("monthly_expenses", "Monthly expenses", { type: "number", min: "0", placeholder: "320000" })}
        {field("currency", "Currency", { maxLength: 5 })}
      </div>
      <div>
        <Label>Main problem</Label>
        <textarea rows={2} className={input} value={form.problem} onChange={set("problem")} disabled={running} placeholder="What is going wrong?" />
      </div>
      {field("goal", "Goal", { placeholder: "e.g. Increase monthly sales" })}

      <div>
        <Label>Sales data (optional CSV)</Label>
        {csvFile ? (
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5">
            <span className="flex min-w-0 items-center gap-2 text-sm text-emerald-200">
              <FileSpreadsheet size={16} className="shrink-0" />
              <span className="truncate">{csvFile.name}</span>
              <span className="shrink-0 text-xs text-emerald-300/70">{(csvFile.size / 1024).toFixed(0)} KB</span>
            </span>
            {!running && (
              <button onClick={() => setCsvFile(null)} className="text-emerald-300 hover:text-white"><X size={16} /></button>
            )}
          </div>
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
            className={`cursor-pointer rounded-xl border border-dashed px-3 py-5 text-center transition ${drag ? "border-indigo-400 bg-indigo-500/10" : "border-rose-500/30 bg-black/60 hover:border-rose-500/60 hover:bg-rose-500/5"}`}
          >
            <UploadCloud size={22} className="mx-auto mb-1.5 text-slate-400" />
            <p className="text-sm text-slate-300">Drop a CSV here or <span className="text-indigo-300">browse</span></p>
            <p className="mt-0.5 text-[11px] text-slate-500">Needs a revenue column (or quantity + price). Date and product columns unlock trends.</p>
          </div>
        )}
        <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
      </div>

      {error && <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}

      {running ? (
        <button onClick={onStop} className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white/5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
          <Loader2 size={16} className="animate-spin" /> Analyzing... <span className="inline-flex items-center gap-1 text-slate-400"><Square size={11} /> Stop</span>
        </button>
      ) : (
        <button onClick={onRun} className="beam-btn group">
          <span>
            <Play size={14} /> Analyze My Business
            <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </button>
      )}
    </Card>
  );
}
