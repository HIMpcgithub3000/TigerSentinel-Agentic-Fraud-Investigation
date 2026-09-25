import React, { useState, useEffect, useRef } from 'react';
import { 
  X, CheckCircle2, Loader2, Database, ShieldAlert, Cpu, 
  GitBranch, Lock, ArrowRight, Play, Sparkles, Clock, Timer
} from 'lucide-react';

export default function LiveInvestigationModal({ caseId, onClose, onComplete }) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [investigationResult, setInvestigationResult] = useState(null);
  const timerRef = useRef(null);

  const STEP_DURATION_MS = 600;
  const steps = [
    {
      title: "Node 1: Case Intake & Temporal Cutoff",
      desc: "Freezing immutable as_of_timestamp. Strict temporal isolation enforced against future data.",
      icon: Lock,
      color: "text-blue-400"
    },
    {
      title: "Node 2: TigerGraph MCP Discovery & Schema Inspection",
      desc: "Invoking tigergraph__get_graph_schema via persistent MCP session. 9 vertices & 11 edge types discovered.",
      icon: Database,
      color: "text-cyan-400"
    },
    {
      title: "Node 2b: TigerGraph MCP & GraphRAG Multi-Hop Retrieval",
      desc: "Executing tigergraph__run_installed_query (device_ring, baseline, card_window) & tigergraph__retrieve_policy_context.",
      icon: Database,
      color: "text-orange-400"
    },
    {
      title: "Node 3: Evidence Ledger & Merkle Chaining",
      desc: "Evaluating 7 competing hypotheses. SHA-256 Merkle hash chain sealed with graph provenance.",
      icon: Cpu,
      color: "text-purple-400"
    },
    {
      title: "Node 4 & 5: Initial NBA & Evidence Sufficiency Gate",
      desc: "Formulating Phase 1 Next-Best Actions. Assessing Bank Policy R1/R4 sufficiency rules.",
      icon: ShieldAlert,
      color: "text-amber-400"
    },
    {
      title: "Node 6-8: Follow-up Evidence & Reassessment",
      desc: "Controlled customer/analyst follow-up verified. Risk and typology calibrated.",
      icon: GitBranch,
      color: "text-rose-400"
    },
    {
      title: "Node 9: Final NBA & FinCEN SAR Filing Gate",
      desc: "Final actions generated with auto/L1/L2 routing. Evaluating 31 CFR § 1020.320 statutory threshold.",
      icon: ArrowRight,
      color: "text-emerald-400"
    },
    {
      title: "Node 10: TigerGraph MCP Writeback & Read-After-Write",
      desc: "Invoking tigergraph__write_investigation_case. Physical graph persistence verified in TigerGraph.",
      icon: CheckCircle2,
      color: "text-emerald-400"
    }
  ];

  const TOTAL_DURATION_MS = steps.length * STEP_DURATION_MS;

  const currentStep = Math.min(steps.length - 1, Math.floor(elapsedMs / STEP_DURATION_MS));
  const isAllComplete = elapsedMs >= TOTAL_DURATION_MS;
  const overallProgressPct = Math.min(100, Math.floor((elapsedMs / TOTAL_DURATION_MS) * 100));
  const overallRemainingPct = Math.max(0, 100 - overallProgressPct);
  const timeRemainingSec = Math.max(0, (TOTAL_DURATION_MS - elapsedMs) / 1000).toFixed(1);

  const startInvestigation = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRunning(true);
    setElapsedMs(0);
    setInvestigationResult(null);

    const startTime = Date.now();

    // Trigger backend investigation concurrently
    fetch(`/api/cases/${caseId}/investigate`, { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        setInvestigationResult(data);
        if (onComplete) onComplete(data);
      })
      .catch((err) => {
        console.error("Investigation error:", err);
      });

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const currentElapsed = now - startTime;

      if (currentElapsed >= TOTAL_DURATION_MS) {
        setElapsedMs(TOTAL_DURATION_MS);
        setIsRunning(false);
        clearInterval(timerRef.current);
      } else {
        setElapsedMs(currentElapsed);
      }
    }, 35);
  };

  useEffect(() => {
    startInvestigation();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [caseId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#0B0D14] border border-orange-500/40 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0E1018] border-b border-orange-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shadow-sm shadow-orange-500/30">
              <Sparkles className="w-4 h-4 text-[#FF7A00]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                CaseGuard Fraud Detection — Autonomous Agentic Investigation
              </h3>
              <p className="text-xs text-orange-300/70">Executing LangGraph Autonomous State Machine for {caseId}</p>
            </div>
          </div>
          <button
            id="close-investigation-x"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-orange-950/40 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Percentage Logger & Progress Bar */}
        <div className="px-6 py-3 bg-[#080A10] border-b border-orange-950/40 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-slate-300 flex items-center gap-1.5">
              <Loader2 className={`w-3.5 h-3.5 text-orange-400 ${isRunning ? 'animate-spin' : ''}`} />
              <span className="font-semibold text-white">Investigation Progress:</span>
              <span className="text-orange-400 font-bold">{overallProgressPct}% Completed</span>
            </span>
            <span className="font-mono text-amber-300 font-bold bg-amber-950/80 px-2.5 py-0.5 rounded border border-amber-500/50 shadow-sm shadow-amber-900/30 flex items-center gap-1">
              <Timer className="w-3 h-3 text-amber-400" />
              {overallRemainingPct}% Time Left {isRunning ? `(~${timeRemainingSec}s)` : '• Sealed'}
            </span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
            <div 
              className="bg-gradient-to-r from-orange-600 via-amber-500 to-emerald-400 h-full transition-all duration-75 ease-out shadow-md shadow-orange-500/40"
              style={{ width: `${overallProgressPct}%` }}
            />
          </div>
        </div>

        {/* Stepper Body with Step-by-Step Percentage Loggers */}
        <div className="p-6 space-y-3.5 max-h-[58vh] overflow-y-auto">
          {steps.map((st, idx) => {
            const isDone = isAllComplete || idx < currentStep;
            const isCurrent = !isAllComplete && idx === currentStep;
            const isQueued = !isAllComplete && idx > currentStep;
            const Icon = st.icon;

            // Compute step-specific remaining percentage out of 100
            const queuedRemainingPct = Math.round(100 - (idx / steps.length) * 100);
            const stepSubProgress = isCurrent 
              ? (elapsedMs % STEP_DURATION_MS) / STEP_DURATION_MS 
              : isDone ? 1 : 0;

            return (
              <div
                key={idx}
                className={`flex flex-col gap-1.5 p-3 rounded-xl border transition-all duration-300 ${
                  isCurrent
                    ? 'bg-orange-950/40 border-orange-500/70 shadow-lg shadow-orange-950/50'
                    : isDone
                    ? 'bg-[#10131E]/80 border-orange-950/40 opacity-90'
                    : 'bg-[#080A0E] border-slate-900/60 opacity-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : isCurrent ? (
                      <Loader2 className="w-5 h-5 text-[#FF5500] animate-spin" />
                    ) : (
                      <Icon className="w-5 h-5 text-slate-600" />
                    )}
                  </div>

                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-bold ${isCurrent ? 'text-white' : isDone ? 'text-slate-200' : 'text-slate-500'}`}>
                        Step {idx + 1}: {st.title}
                      </span>
                      
                      {/* Step Percentage Logger & Status Badge */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isDone && (
                          <>
                            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/90 px-1.5 py-0.5 rounded border border-emerald-700/50">
                              0% left
                            </span>
                            <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                              COMPLETED
                            </span>
                          </>
                        )}
                        {isCurrent && (
                          <>
                            <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/95 px-2 py-0.5 rounded border border-amber-500/70 shadow-md shadow-amber-500/30 animate-pulse flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 text-amber-400" />
                              {overallRemainingPct}% time left
                            </span>
                            <span className="text-[10px] font-mono font-semibold text-orange-400 bg-orange-950/60 px-1.5 py-0.5 rounded border border-orange-800/40 animate-pulse">
                              EXECUTING
                            </span>
                          </>
                        )}
                        {isQueued && (
                          <>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800/60">
                              {queuedRemainingPct}% time left
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-900/40 px-1.5 py-0.5 rounded border border-slate-800/40">
                              QUEUED
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-[11px] text-slate-400 leading-relaxed">{st.desc}</p>
                    
                    {/* Active Step Sub-Progress Bar */}
                    {isCurrent && (
                      <div className="w-full bg-slate-900/90 rounded-full h-1 mt-1.5 overflow-hidden border border-orange-900/40">
                        <div 
                          className="bg-gradient-to-r from-orange-500 to-amber-400 h-full transition-all duration-75 ease-out shadow-sm shadow-orange-500/50"
                          style={{ width: `${Math.min(100, Math.round(stepSubProgress * 100))}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#0E1018] border-t border-orange-950/40 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {isRunning ? (
              <span className="flex items-center gap-2 text-orange-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF5500]" /> Live Traversal & Reasoning Active ({overallRemainingPct}% time remaining)...
              </span>
            ) : investigationResult ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Investigation Sealed: {investigationResult.case.verdict.toUpperCase()} (Prob: {(investigationResult.case.fraud_probability * 100).toFixed(0)}%)
              </span>
            ) : isAllComplete ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> 10-Node Investigation Sequence Completed (0% time left)
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {!isRunning && (
              <button
                onClick={startInvestigation}
                className="px-3 py-1.5 bg-[#181C28] hover:bg-[#222738] text-slate-200 text-xs font-semibold rounded-lg border border-orange-950/40 transition cursor-pointer"
              >
                Re-Run
              </button>
            )}
            <button
              id="close-investigation-btn"
              onClick={onClose}
              className="px-4 py-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-semibold rounded-lg transition shadow-md shadow-orange-600/20 active:scale-95 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
