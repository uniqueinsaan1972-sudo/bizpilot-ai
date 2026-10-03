"use client";
import { useEffect, useRef, useState } from "react";
import { BrainCircuit, Rocket } from "lucide-react";
import BusinessForm from "../components/BusinessForm";
import Workflow from "../components/Workflow";
import Overview from "../components/Overview";
import Charts from "../components/Charts";
import ResultTabs from "../components/ResultTabs";
import { Card } from "../components/ui";
import { streamAnalysis } from "../lib/api";
import { AGENTS, DEMO } from "../lib/agents";

const EMPTY = { business_name: "", industry: "", products: "", target_audience: "", monthly_revenue: "", monthly_expenses: "", currency: "PKR", problem: "", goal: "" };

function validate(f) {
  const need = { business_name: "Business name", industry: "Industry", target_audience: "Target audience", problem: "Main problem", goal: "Goal" };
  for (const [k, label] of Object.entries(need)) if (!f[k].trim()) return `Please fill in: ${label}`;
  for (const k of ["monthly_revenue", "monthly_expenses"]) {
    if (f[k] === "" || Number.isNaN(+f[k]) || +f[k] < 0) return `${k === "monthly_revenue" ? "Monthly revenue" : "Monthly expenses"} must be a number (0 or more)`;
  }
  return "";
}

export default function Home() {
  const [form, setForm] = useState(EMPTY);
  const [csvFile, setCsvFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | running | done | error
  const [agents, setAgents] = useState({});
  const [outputs, setOutputs] = useState({});
  const [csv, setCsv] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("analysis");
  const [snap, setSnap] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [runStart, setRunStart] = useState(null);
  const [runEnd, setRunEnd] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [status]);

  async function loadDemo() {
    setForm(DEMO);
    setError("");
    try {
      const blob = await (await fetch("/abc_clothing_sales.csv")).blob();
      setCsvFile(new File([blob], "abc_clothing_sales.csv", { type: "text/csv" }));
    } catch { setError("Could not load the demo CSV."); }
  }

  function onEvent(ev) {
    if (ev.type === "csv_processed") setCsv(ev.summary);
    else if (ev.type === "agent_start") setAgents((a) => ({ ...a, [ev.agent]: { status: "running", startedAt: Date.now() } }));
    else if (ev.type === "agent_complete") {
      setAgents((a) => ({ ...a, [ev.agent]: { status: "done", seconds: ev.duration_seconds } }));
      const key = AGENTS.find((x) => x.id === ev.agent).key;
      setOutputs((o) => ({ ...o, [key]: ev.output }));
    } else if (ev.type === "agent_error") setAgents((a) => ({ ...a, [ev.agent]: { status: "error" } }));
    else if (ev.type === "error") { setError(ev.message); setStatus("error"); }
    else if (ev.type === "final") setStatus((s) => (s === "error" ? s : "done"));
  }

  async function run() {
    const problem = validate(form);
    if (problem) return setError(problem);
    const t0 = Date.now();
    setError(""); setOutputs({}); setCsv(null); setAgents({}); setSnap({ ...form }); setTab("analysis");
    setStatus("running"); setRunStart(t0); setRunEnd(null); setNow(t0);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      await streamAnalysis(form, csvFile, onEvent, ctrl.signal);
    } catch (e) {
      if (e.name === "AbortError") setStatus("idle");
      else { setError(e.message); setStatus("error"); }
    }
    setRunEnd(Date.now());
    setStatus((s) => (s === "running" ? "done" : s));
  }

  const b = snap || form;
  const started = status !== "idle" || snap;

  return (
    <div className="mx-auto max-w-[1500px] px-4 pb-16 sm:px-6">
      <header className="flex items-center justify-between py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-[0_0_26px_rgba(224,32,138,0.6)] ring-1 ring-white/20">
            <BrainCircuit size={22} />
          </span>
          <div>
            <h1 className="text-lg font-bold tracking-[0.2em] text-white">BIZPILOT <span className="bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent">AI</span></h1>
            <p className="text-xs text-slate-400">Turn Business Data Into Your Next Best Move.</p>
          </div>
        </div>
        <span className="hidden items-center gap-2 rounded-full border border-line bg-white/5 px-3 py-1.5 text-xs text-slate-300 sm:inline-flex">
          <span className="h-2 w-2 rounded-full bg-emerald-400" /> 5 AI agents · live pipeline
        </span>
      </header>

      <div className="grid gap-5 lg:grid-cols-[390px_1fr]">
        <aside className="space-y-5 lg:sticky lg:top-4 lg:self-start">
          <BusinessForm form={form} setForm={setForm} csvFile={csvFile} setCsvFile={setCsvFile} running={status === "running"}
            error={error} onRun={run} onStop={() => abortRef.current?.abort()} onDemo={loadDemo} />
        </aside>

        <main className="min-w-0 space-y-5">
          <Workflow agents={agents} now={now} runStart={runStart} runEnd={runEnd} status={status} csv={csv} />

          {!started ? (
            <Card className="py-14 text-center">
              <Rocket size={34} className="mx-auto mb-3 text-indigo-400" />
              <h2 className="text-lg font-semibold text-white">Ready for takeoff</h2>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">
                Fill in your business details (or click <span className="text-indigo-300">Load demo</span>), optionally upload sales data, and press
                <span className="text-indigo-300"> Analyze My Business</span>. Five AI agents will build your plan step by step.
              </p>
            </Card>
          ) : (
            <>
              <Overview b={b} a={outputs.analysis} csv={csv} />
              <Charts rev={+b.monthly_revenue || 0} exp={+b.monthly_expenses || 0}
                profit={outputs.analysis ? outputs.analysis.estimated_monthly_profit : (+b.monthly_revenue || 0) - (+b.monthly_expenses || 0)} csv={csv} />
              <ResultTabs outputs={outputs} agents={agents} tab={tab} setTab={setTab} b={b} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
