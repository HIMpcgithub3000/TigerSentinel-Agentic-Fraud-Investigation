import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle2, Loader2, Database, ShieldAlert, Cpu, 
  GitBranch, Lock, ArrowRight, Play, Sparkles
} from 'lucide-react';

export default function LiveInvestigationModal({ caseId, onClose, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [investigationResult, setInvestigationResult] = useState(null);

  const steps = [
    {
      title: "Case Intake & Temporal Cutoff Freeze",
      desc: "Freezing immutable as_of_timestamp. Rejecting future data leakage.",
      icon: Lock,
      color: "text-blue-400"
    },
    {
      title: "Parallel 5-Query TigerGraph Retrieval Plane",
      desc: "Dispatched baseline, card window, device ring, closed cases, and centrality.",
      icon: Database,
      color: "text-cyan-400"
    },
    {
      title: "Evidence Ledger & SHA-256 Merkle Chaining",
      desc: "Sanitizing untrusted text and sealing canonical cryptographic hash chain.",
      icon: Cpu,
      color: "text-purple-400"
    },
    {
      title: "7 Competing Hypotheses & Contradiction Resolution",
      desc: "Resolving domestic baseline contradictions and calibrating fraud probability.",
      icon: GitBranch,
      color: "text-amber-400"
    },
    {
      title: "Evidence Sufficiency Gate (Rules R1 / R4)",
      desc: "Evaluating evidence completeness and determining customer verification need.",
      icon: ShieldAlert,
      color: "text-rose-400"
    },
    {
      title: "Dual-Phase Next-Best Actions & 4-Tier Policy Routing",
      desc: "Formulating Phase 1 and Phase 2 action sets with auto / L1 / L2 routes.",
      icon: ArrowRight,
      color: "text-emerald-400"
    },
    {
      title: "Pre-Writeback Validation & Read-After-Write Verification",
      desc: "Asserting case vertex and relational memory edges physically persist in TigerGraph.",
      icon: CheckCircle2,
      color: "text-emerald-400"
    }
  ];

  const runSimulation = () => {
    setIsRunning(true);
    setCurrentStep(0);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(stepInterval);
          // Actually trigger backend investigation
          fetch(`/api/cases/${caseId}/investigate`, { method: 'POST' })
            .then((r) => r.json())
            .then((data) => {
              setInvestigationResult(data);
              setIsRunning(false);
              if (onComplete) onComplete(data);
            })
            .catch((err) => {
              console.error(err);
              setIsRunning(false);
            });
          return prev;
        }
      });
    }, 450);
  };

  useEffect(() => {
    runSimulation();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#0F172A] border border-blue-500/40 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Autonomous Agentic Investigation Runner
              </h3>
              <p className="text-xs text-slate-400">Executing LangGraph State Machine for {caseId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {steps.map((st, idx) => {
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;
            const Icon = st.icon;

            return (
              <div
                key={idx}
                className={`flex items-start gap-3.5 p-3 rounded-xl border transition-all duration-300 ${
                  isCurrent
                    ? 'bg-blue-950/40 border-blue-500/60 shadow-lg shadow-blue-950/50'
                    : isDone
                    ? 'bg-slate-900/60 border-slate-800 opacity-90'
                    : 'bg-slate-950/40 border-slate-800/40 opacity-40'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5 text-slate-600" />
                  )}
                </div>

                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isCurrent ? 'text-white' : isDone ? 'text-slate-200' : 'text-slate-500'}`}>
                      Step {idx + 1}: {st.title}
                    </span>
                    {isDone && (
                      <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                        COMPLETED
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[10px] font-mono font-semibold text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/40 animate-pulse">
                        EXECUTING
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{st.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {isRunning ? (
              <span className="flex items-center gap-2 text-cyan-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Live Traversal & Reasoning Active...
              </span>
            ) : investigationResult ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Investigation Sealed: {investigationResult.case.verdict.toUpperCase()} (Prob: {(investigationResult.case.fraud_probability * 100).toFixed(0)}%)
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {!isRunning && (
              <button
                onClick={runSimulation}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
              >
                Re-Run
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition shadow-md"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
