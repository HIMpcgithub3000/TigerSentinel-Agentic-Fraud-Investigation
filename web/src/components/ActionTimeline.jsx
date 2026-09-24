import React from 'react';
import { ArrowRight, ShieldAlert, CheckCircle2, UserCheck, Clock, FileWarning } from 'lucide-react';

export default function ActionTimeline({ nba, evidenceRequests, onApprove }) {
  if (!nba) return null;

  const initial = nba.initial || [];
  const final = nba.final || [];
  const whatChanged = nba.what_changed || "nothing";
  const evReq = evidenceRequests && evidenceRequests.length > 0 ? evidenceRequests[0] : null;

  const getRouteBadge = (route) => {
    switch (route) {
      case 'auto':
        return <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">AUTO</span>;
      case 'L1':
        return <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">L1 APPROVAL</span>;
      case 'L2':
        return <span className="px-2 py-0.5 text-[10px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded">L2 MANAGER</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-700 text-slate-300 rounded">{route}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* 2-Phase Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Phase 1: Initial Actions */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" /> Phase 1: Initial Recommendation
            </span>
            <span className="text-[10px] text-slate-500">Before Extra Evidence</span>
          </div>
          <div className="space-y-2.5">
            {initial.map((a, idx) => (
              <div key={idx} className="p-2.5 bg-slate-800/50 rounded-lg border border-slate-700/60">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-100">{a.action}</span>
                  {getRouteBadge(a.route)}
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{a.reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Phase 2: Final Actions */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-blue-900/40">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-400" /> Phase 2: Final Recommendation
            </span>
            <span className="text-[10px] text-blue-400/80">After Evidence Ingestion</span>
          </div>
          <div className="space-y-2.5">
            {final.map((a, idx) => (
              <div key={idx} className="p-2.5 bg-blue-950/20 rounded-lg border border-blue-900/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-blue-100">{a.action}</span>
                  <div className="flex items-center gap-2">
                    {getRouteBadge(a.route)}
                    {a.route !== 'auto' && onApprove && (
                      <button
                        onClick={() => onApprove(a.action, a.route)}
                        className="px-2 py-0.5 text-[10px] font-medium bg-blue-600 hover:bg-blue-500 text-white rounded transition shadow-sm"
                      >
                        Authorize
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{a.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controlled Evidence Request & Response Interlude */}
      {evReq && (
        <div className="p-3 bg-purple-950/20 rounded-lg border border-purple-900/40 flex items-start gap-3">
          <UserCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-semibold text-purple-300">Controlled Follow-Up Dispatched ({evReq.type}):</span>
            <p className="text-slate-300 italic">"{evReq.assumed_response}"</p>
          </div>
        </div>
      )}

      {/* What Changed Banner */}
      {whatChanged && whatChanged !== "nothing" && (
        <div className="p-3 bg-emerald-950/20 rounded-lg border border-emerald-900/40 flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span><strong>Progression Shift:</strong> {whatChanged}</span>
        </div>
      )}
    </div>
  );
}
